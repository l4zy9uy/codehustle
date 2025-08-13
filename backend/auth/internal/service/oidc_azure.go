package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"codehustle/backend/auth/internal/config"
	"codehustle/backend/auth/internal/db"
	"codehustle/backend/auth/internal/models"
	"codehustle/backend/auth/internal/repository"
	"codehustle/backend/auth/internal/utils"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

type AzureOIDC struct {
	provider *oidc.Provider
	verifier *oidc.IDTokenVerifier
	config   *oauth2.Config
}

func NewAzureOIDC(ctx context.Context) (*AzureOIDC, error) {
	tenant := config.Get("AZURE_TENANT_ID")
	clientID := config.Get("AZURE_CLIENT_ID")
	clientSecret := config.Get("AZURE_CLIENT_SECRET")
	redirect := config.Get("AZURE_REDIRECT_URI")
	if tenant == "" || clientID == "" || clientSecret == "" || redirect == "" {
		return nil, errors.New("azure oidc not configured")
	}
	issuer := fmt.Sprintf("https://login.microsoftonline.com/%s/v2.0", tenant)
	provider, err := oidc.NewProvider(ctx, issuer)
	if err != nil {
		return nil, err
	}
	conf := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Endpoint:     provider.Endpoint(),
		RedirectURL:  redirect,
		Scopes:       []string{oidc.ScopeOpenID, "email", "profile"},
	}
	verifier := provider.Verifier(&oidc.Config{ClientID: clientID})
	return &AzureOIDC{provider: provider, verifier: verifier, config: conf}, nil
}

func (a *AzureOIDC) Start(state string) (string, error) {
	return a.config.AuthCodeURL(state, oauth2.AccessTypeOffline), nil
}

type OIDCProfile struct {
	Email      string
	OID        string
	TID        string
	GivenName  string
	FamilyName string
}

func (a *AzureOIDC) Callback(ctx context.Context, code string) (*OIDCProfile, error) {
	oauth2Token, err := a.config.Exchange(ctx, code)
	if err != nil {
		return nil, err
	}
	rawID, ok := oauth2Token.Extra("id_token").(string)
	if !ok {
		return nil, errors.New("no id_token")
	}
	idToken, err := a.verifier.Verify(ctx, rawID)
	if err != nil {
		return nil, err
	}
	var claims struct {
		Email      string `json:"email"`
		OID        string `json:"oid"`
		TID        string `json:"tid"`
		GivenName  string `json:"given_name"`
		FamilyName string `json:"family_name"`
		Preferred  string `json:"preferred_username"`
	}
	if err := idToken.Claims(&claims); err != nil {
		return nil, err
	}
	email := claims.Email
	if email == "" {
		email = claims.Preferred
	}
	return &OIDCProfile{
		Email:      email,
		OID:        claims.OID,
		TID:        claims.TID,
		GivenName:  claims.GivenName,
		FamilyName: claims.FamilyName,
	}, nil
}

func LinkOrCreateAzureUser(p *OIDCProfile) (*models.User, error) {
	if p.Email == "" || p.OID == "" || p.TID == "" {
		return nil, errors.New("missing oidc claims")
	}
	providerSub := p.TID + ":" + p.OID

	oi, err := repository.FindOAuthIdentity("azure", providerSub)
	if err != nil {
		return nil, err
	}
	if oi != nil {
		return repository.FindUserByID(oi.UserID)
	}

	u, err := repository.FindUserByEmail(p.Email)
	if err != nil {
		return nil, err
	}
	if u == nil {
		u = &models.User{
			ID:            utils.NewID(),
			Email:         strings.ToLower(p.Email),
			PasswordHash:  utils.NewID(), // unusable placeholder
			FirstName:     p.GivenName,
			LastName:      p.FamilyName,
			IsActive:      true,
			EmailVerified: true,
		}
		if err := db.DB.Create(u).Error; err != nil {
			return nil, err
		}
	}
	oi = &models.OAuthIdentity{
		ID:          utils.NewID(),
		UserID:      u.ID,
		Provider:    "azure",
		ProviderSub: providerSub,
	}
	if err := repository.CreateOAuthIdentity(oi); err != nil {
		return nil, err
	}
	return u, nil
}
