package crypto

import (
	"strconv"
	"time"

	"codehustle/backend/auth/internal/config"

	"github.com/golang-jwt/jwt/v4"
)

type AccessClaims struct {
	Sub   string   `json:"sub"`
	Email string   `json:"email"`
	Roles []string `json:"roles"`
	SID   string   `json:"sid"`
	jwt.RegisteredClaims
}

func (a *AccessClaims) GetRoles() []string { return a.Roles }

func MintAccess(sub, email string, roles []string, sid string) (string, error) {
	ks, err := Current()
	if err != nil {
		return "", err
	}
	iat := time.Now()
	exp := iat.Add(time.Duration(parseEnvInt("ACCESS_TTL_MINUTES", 15)) * time.Minute)

	claims := AccessClaims{
		Sub:   sub,
		Email: email,
		Roles: roles,
		SID:   sid,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    config.Get("JWT_ISS"),
			Audience:  jwt.ClaimStrings{config.Get("JWT_AUD")},
			IssuedAt:  jwt.NewNumericDate(iat),
			ExpiresAt: jwt.NewNumericDate(exp),
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	t.Header["kid"] = ks.ActiveKID
	return t.SignedString(ks.Priv)
}

func parseEnvInt(key string, def int) int {
	v := config.Get(key)
	if v == "" {
		return def
	}
	i, err := strconv.Atoi(v)
	if err != nil || i <= 0 {
		return def
	}
	return i
}
