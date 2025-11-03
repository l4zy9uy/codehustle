package handlers

import (
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	mysqldriver "github.com/go-sql-driver/mysql"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"codehustle/backend/internal/config"
	"codehustle/backend/internal/constants"
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/middleware"
	"codehustle/backend/internal/models"
)

// RegisterRequest is the expected payload for user registration
type RegisterRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// RegisterUser handles new user registration
func RegisterUser(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could_not_hash_password"})
		return
	}
	user := models.User{
		ID:           uuid.NewString(),
		Email:        req.Email,
		PasswordHash: string(hash),
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		IsActive:     true,
	}
	if err := db.DB.Create(&user).Error; err != nil {
		var mysqlErr *mysqldriver.MySQLError
		if errors.As(err, &mysqlErr) {
			if mysqlErr.Number == 1062 {
				c.JSON(http.StatusConflict, gin.H{
					"error":   "email_already_in_use",
					"message": "An account with this email already exists",
				})
				return
			}
		}
		// Check for duplicate key error by string (fallback)
		if strings.Contains(err.Error(), "Duplicate entry") {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "email_already_in_use",
				"message": "An account with this email already exists",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "registration_failed",
			"message": err.Error(),
		})
		return
	}

	// Assign default student role
	var roleID int
	if err := db.DB.Raw("SELECT id FROM roles WHERE name = ?", constants.RoleStudent).Scan(&roleID).Error; err != nil {
		log.Printf("[AUTH] Failed to find student role: %v", err)
	} else {
		if err := db.DB.Exec("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id=user_id", user.ID, roleID).Error; err != nil {
			log.Printf("[AUTH] Failed to assign default student role to user %s: %v", user.ID, err)
			// Don't fail registration if role assignment fails, but log it
		}
	}

	c.JSON(http.StatusCreated, gin.H{"id": user.ID})
}

// LoginRequest represents the expected payload for login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse is returned upon successful authentication
type LoginResponse struct {
	Token string `json:"token"`
}

// Login handles user authentication and JWT issuance
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Retrieve user
	var user models.User
	if err := db.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_credentials"})
		return
	}

	// Verify password
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_credentials"})
		return
	}

	// Load user roles from database
	var roles []string
	if err := db.DB.Raw(`
		SELECT r.name 
		FROM roles r 
		INNER JOIN user_roles ur ON r.id = ur.role_id 
		WHERE ur.user_id = ?
	`, user.ID).Scan(&roles).Error; err != nil {
		log.Printf("[AUTH] Failed to load roles for user %s: %v", user.ID, err)
		// Continue with empty roles if query fails
		roles = []string{}
	}
	user.Roles = roles

	// Prepare JWT claims
	secret := config.Get("JWT_SECRET")
	claims := jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"roles": user.Roles,
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
		"jti":   uuid.NewString(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token_generation_failed"})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{Token: signed})
}

// GetMeResponse represents the response for the /me endpoint
type GetMeResponse struct {
	ID        string   `json:"id"`
	Email     string   `json:"email"`
	FirstName string   `json:"first_name"`
	LastName  string   `json:"last_name"`
	IsActive  bool     `json:"is_active"`
	Roles     []string `json:"roles"`
}

// GetMe returns the current authenticated user's profile
func GetMe(c *gin.Context) {
	// Get user context from middleware
	val, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing_user_context"})
		return
	}

	userCtx, ok := val.(middleware.UserContext)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_user_context"})
		return
	}

	// Fetch full user record from database
	var user models.User
	if err := db.DB.Where("id = ?", userCtx.ID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user_not_found"})
		return
	}

	// Load user roles from database
	var roles []string
	if err := db.DB.Raw(`
		SELECT r.name 
		FROM roles r 
		INNER JOIN user_roles ur ON r.id = ur.role_id 
		WHERE ur.user_id = ?
	`, user.ID).Scan(&roles).Error; err != nil {
		log.Printf("[AUTH] Failed to load roles for user %s: %v", user.ID, err)
		// Continue with empty roles if query fails
		roles = []string{}
	}

	// Return only the requested fields
	response := GetMeResponse{
		ID:        user.ID,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		IsActive:  user.IsActive,
		Roles:     roles,
	}

	c.JSON(http.StatusOK, response)
}
