package service

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"codehustle/backend/auth/internal/crypto"
	"codehustle/backend/auth/internal/models"
	"codehustle/backend/auth/internal/repository"
	"codehustle/backend/auth/internal/utils"
)

type LoginResult struct {
	AccessToken   string
	RefreshCookie string
	RefreshTTL    time.Duration
	User          *models.User
	FamilyID      string
}

func LoginWithPassword(email, password string) (*LoginResult, error) {
	u, err := repository.FindUserByEmail(email)
	if err != nil {
		return nil, err
	}
	if u == nil || !u.IsActive {
		return nil, errors.New("invalid_credentials")
	}
	if !utils.CheckPassword(u.PasswordHash, password) {
		return nil, errors.New("invalid_credentials")
	}
	return issueTokensForUser(u, true, "")
}

func issueTokensForUser(u *models.User, startNewFamily bool, familyID string) (*LoginResult, error) {
	if startNewFamily || familyID == "" {
		familyID = utils.NewID()
	}
	secret := utils.NewID() + utils.NewID()
	rtID := utils.NewID()
	hash := sha256.Sum256([]byte(secret))
	rt := &models.RefreshToken{
		ID:        rtID,
		UserID:    u.ID,
		FamilyID:  familyID,
		TokenHash: hex.EncodeToString(hash[:]),
		ExpiresAt: time.Now().Add(time.Duration(utils.ParseIntEnv("REFRESH_TTL_DAYS", 120)) * 24 * time.Hour),
	}
	if err := repository.CreateRefreshToken(rt); err != nil {
		return nil, err
	}

	roles := make([]string, 0, len(u.Roles))
	for _, r := range u.Roles {
		roles = append(roles, r.Name)
	}
	access, err := crypto.MintAccess(u.ID, u.Email, roles, familyID)
	if err != nil {
		return nil, err
	}

	return &LoginResult{
		AccessToken:   access,
		RefreshCookie: rtID + "." + secret,
		RefreshTTL:    time.Until(rt.ExpiresAt),
		User:          u,
		FamilyID:      familyID,
	}, nil
}

func Refresh(refreshCookie string) (*LoginResult, error) {
	id, secret, err := splitRefresh(refreshCookie)
	if err != nil {
		return nil, errors.New("invalid_refresh")
	}
	rt, err := repository.GetRefreshTokenByID(id)
	if err != nil {
		return nil, errors.New("invalid_refresh")
	}
	if rt.IsRevoked || time.Now().After(rt.ExpiresAt) {
		_ = repository.RevokeFamily(rt.FamilyID)
		return nil, errors.New("invalid_refresh")
	}
	hash := sha256.Sum256([]byte(secret))
	if !strings.EqualFold(rt.TokenHash, hex.EncodeToString(hash[:])) {
		_ = repository.RevokeFamily(rt.FamilyID)
		return nil, errors.New("invalid_refresh")
	}
	_ = repository.RevokeRefreshToken(rt.ID)
	_ = repository.MarkUsedNow(rt.ID)

	u, err := repository.FindUserByID(rt.UserID)
	if err != nil || u == nil || !u.IsActive {
		return nil, errors.New("invalid_user")
	}
	return issueTokensForUser(u, false, rt.FamilyID)
}

func Logout(refreshCookie string, all bool) error {
	id, _, err := splitRefresh(refreshCookie)
	if err != nil {
		return nil
	}
	rt, err := repository.GetRefreshTokenByID(id)
	if err != nil {
		return nil
	}
	if all {
		return repository.RevokeFamily(rt.FamilyID)
	}
	return repository.RevokeRefreshToken(rt.ID)
}

func splitRefresh(v string) (string, string, error) {
	parts := strings.SplitN(v, ".", 2)
	if len(parts) != 2 {
		return "", "", fmt.Errorf("bad format")
	}
	return parts[0], parts[1], nil
}
