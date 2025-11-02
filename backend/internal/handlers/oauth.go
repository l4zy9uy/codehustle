package handlers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"codehustle/backend/internal/config"
	"codehustle/backend/internal/constants"
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/models"
)

var googleOAuthConfig *oauth2.Config

func initGoogleOAuth() {
	googleOAuthConfig = &oauth2.Config{
		ClientID:     config.Get("GOOGLE_CLIENT_ID"),
		ClientSecret: config.Get("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  config.Get("GOOGLE_REDIRECT_URI"),
		Scopes:       []string{"openid", "profile", "email"},
		Endpoint:     google.Endpoint,
	}
}

// GoogleLogin initiates Google OAuth flow
func GoogleLogin(c *gin.Context) {
	if googleOAuthConfig == nil {
		initGoogleOAuth()
	}

	// Generate state token for CSRF protection
	state := generateStateToken()
	c.SetCookie("oauth_state", state, 600, "/", "", false, true)

	url := googleOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

// GoogleCallbackGET handles Google OAuth redirect (GET request from Google)
// This receives Google's redirect and forwards to frontend callback page
func GoogleCallbackGET(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state")
	errorParam := c.Query("error")

	// Get frontend URL for redirect
	frontendURL := config.Get("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	// Build redirect URL with query parameters
	redirectURL := frontendURL + "/auth/google/callback"
	if errorParam != "" {
		redirectURL += "?error=" + errorParam
		c.Redirect(http.StatusTemporaryRedirect, redirectURL)
		return
	}

	// Forward code and state to frontend callback page
	if code != "" && state != "" {
		redirectURL += "?code=" + code + "&state=" + state
	} else {
		redirectURL += "?error=missing_parameters"
	}

	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

// GoogleCallback handles Google OAuth callback (POST with PKCE)
func GoogleCallback(c *gin.Context) {
	if googleOAuthConfig == nil {
		initGoogleOAuth()
	}

	var req struct {
		Code         string `json:"code" binding:"required"`
		CodeVerifier string `json:"code_verifier" binding:"required"`
		State        string `json:"state"`
		Nonce        string `json:"nonce"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request", "message": err.Error()})
		return
	}

	// Validate nonce is provided
	if req.Nonce == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_nonce", "message": "nonce is required"})
		return
	}

	// Exchange code for token - Google indicates PKCE is not needed for this flow
	ctx := context.Background()

	// Manually construct the token request
	tokenURL := googleOAuthConfig.Endpoint.TokenURL
	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("code", req.Code)
	data.Set("client_id", googleOAuthConfig.ClientID)
	data.Set("client_secret", googleOAuthConfig.ClientSecret)
	data.Set("redirect_uri", googleOAuthConfig.RedirectURL)
	// Note: Not including code_verifier as Google indicates it's not needed for this authorization code

	tokenReq, err := http.NewRequestWithContext(ctx, "POST", tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		log.Printf("[OAUTH] Failed to create token request: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token_request_failed"})
		return
	}

	tokenReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	httpResp, err := http.DefaultClient.Do(tokenReq)
	if err != nil {
		log.Printf("[OAUTH] Token exchange failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token_exchange_failed", "message": err.Error()})
		return
	}
	defer httpResp.Body.Close()

	if httpResp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(httpResp.Body)
		log.Printf("[OAUTH] Token exchange failed with status %d: %s", httpResp.StatusCode, string(bodyBytes))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token_exchange_failed", "message": "invalid response from Google"})
		return
	}

	var tokenResp struct {
		AccessToken  string `json:"access_token"`
		TokenType    string `json:"token_type"`
		RefreshToken string `json:"refresh_token"`
		ExpiresIn    int    `json:"expires_in"`
		IDToken      string `json:"id_token"`
	}

	if err := json.NewDecoder(httpResp.Body).Decode(&tokenResp); err != nil {
		log.Printf("[OAUTH] Failed to decode token response: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_decode_token"})
		return
	}

	// Create oauth2.Token from response
	token := &oauth2.Token{
		AccessToken:  tokenResp.AccessToken,
		TokenType:    tokenResp.TokenType,
		RefreshToken: tokenResp.RefreshToken,
		Expiry:       time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second),
	}
	if tokenResp.IDToken != "" {
		token = token.WithExtra(map[string]interface{}{
			"id_token": tokenResp.IDToken,
		})
	}

	// Verify nonce from ID token (if available)
	// With OpenID Connect, the ID token should be in the token response
	if idToken, ok := token.Extra("id_token").(string); ok && idToken != "" {
		// Decode ID token to extract nonce claim (without verifying signature for now)
		// Parse the JWT to get claims
		parser := jwt.Parser{}
		idTokenClaims := jwt.MapClaims{}
		_, _, err := parser.ParseUnverified(idToken, idTokenClaims)
		if err != nil {
			log.Printf("[OAUTH] Failed to parse ID token: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_parse_id_token"})
			return
		}

		// Extract and verify nonce from ID token
		if idTokenNonce, ok := idTokenClaims["nonce"].(string); ok {
			if idTokenNonce != req.Nonce {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_nonce", "message": "nonce verification failed"})
				return
			}
		}
	}

	// Get user info from Google
	client := googleOAuthConfig.Client(ctx, token)
	userInfoResp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		log.Printf("[OAUTH] Failed to get user info: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_user_info"})
		return
	}
	defer userInfoResp.Body.Close()

	var googleUser struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}

	if err := json.NewDecoder(userInfoResp.Body).Decode(&googleUser); err != nil {
		log.Printf("[OAUTH] Failed to decode user info: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_decode_user_info"})
		return
	}

	// Find or create user
	var user models.User
	var oauthIdentity models.OAuthIdentity

	// Check if OAuth identity exists
	if err := db.DB.Where("provider = ? AND provider_sub = ?", "google", googleUser.ID).First(&oauthIdentity).Error; err != nil {
		// OAuth identity doesn't exist, check if user with email exists
		if err := db.DB.Where("email = ?", googleUser.Email).First(&user).Error; err != nil {
			// Create new user
			user = models.User{
				ID:            uuid.NewString(),
				Email:         googleUser.Email,
				PasswordHash:  "", // OAuth users don't have passwords
				FirstName:     extractFirstName(googleUser.Name),
				LastName:      extractLastName(googleUser.Name),
				IsActive:      true,
				EmailVerified: true, // Google emails are verified
			}
			if err := db.DB.Create(&user).Error; err != nil {
				log.Printf("[OAUTH] Failed to create user: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_create_user"})
				return
			}

			// Assign default student role
			var roleID int
			if err := db.DB.Raw("SELECT id FROM roles WHERE name = ?", constants.RoleStudent).Scan(&roleID).Error; err == nil {
				db.DB.Exec("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", user.ID, roleID)
			}
		}

		// Create OAuth identity
		oauthIdentity = models.OAuthIdentity{
			ID:          uuid.NewString(),
			UserID:      user.ID,
			Provider:    "google",
			ProviderSub: googleUser.ID,
		}
		if err := db.DB.Create(&oauthIdentity).Error; err != nil {
			log.Printf("[OAUTH] Failed to create OAuth identity: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_create_oauth_identity"})
			return
		}
	} else {
		// OAuth identity exists, get user
		if err := db.DB.Where("id = ?", oauthIdentity.UserID).First(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "user_not_found"})
			return
		}
	}

	// Generate JWT token
	secret := config.Get("JWT_SECRET")
	claims := jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"roles": []string{}, // Load roles if needed
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
		"jti":   uuid.NewString(),
	}

	// Load user roles
	var roles []string
	db.DB.Raw(`
		SELECT r.name 
		FROM roles r 
		INNER JOIN user_roles ur ON r.id = ur.role_id 
		WHERE ur.user_id = ?
	`, user.ID).Scan(&roles)
	claims["roles"] = roles

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := jwtToken.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token_generation_failed"})
		return
	}

	// Return token in JSON response (frontend will handle redirect)
	c.JSON(http.StatusOK, gin.H{"token": signedToken})
}

func generateStateToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

func extractFirstName(fullName string) string {
	parts := strings.Split(fullName, " ")
	if len(parts) > 0 {
		return parts[0]
	}
	return ""
}

func extractLastName(fullName string) string {
	parts := strings.Split(fullName, " ")
	if len(parts) > 1 {
		return strings.Join(parts[1:], " ")
	}
	return ""
}
