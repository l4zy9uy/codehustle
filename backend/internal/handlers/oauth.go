package handlers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
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

// GoogleCallback handles Google OAuth callback
func GoogleCallback(c *gin.Context) {
	if googleOAuthConfig == nil {
		initGoogleOAuth()
	}

	// Verify state token
	stateCookie, err := c.Cookie("oauth_state")
	if err != nil || stateCookie != c.Query("state") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_state"})
		return
	}

	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_code"})
		return
	}

	// Exchange code for token
	token, err := googleOAuthConfig.Exchange(context.Background(), code)
	if err != nil {
		log.Printf("[OAUTH] Token exchange failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token_exchange_failed"})
		return
	}

	// Get user info from Google
	client := googleOAuthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		log.Printf("[OAUTH] Failed to get user info: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_user_info"})
		return
	}
	defer resp.Body.Close()

	var googleUser struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
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

	// Redirect to frontend with token
	frontendURL := config.Get("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}
	c.Redirect(http.StatusTemporaryRedirect, frontendURL+"/auth/callback?token="+signedToken)
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
