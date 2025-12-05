package handlers

import (
	"encoding/csv"
	"errors"
	"fmt"
	"log"
	"mime/multipart"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	mysqldriver "github.com/go-sql-driver/mysql"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/sethvargo/go-password/password"
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
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "invalid_credentials",
			"message": "The email or password you entered is incorrect. Please try again.",
		})
		return
	}

	// Verify password
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "invalid_credentials",
			"message": "The email or password you entered is incorrect. Please try again.",
		})
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

// BatchAccountRequest represents the expected payload for batch account creation
type BatchAccountRequest struct {
	CSVFile *multipart.FileHeader `form:"csv_file" binding:"required"`
}

// AccountResult represents a single account creation result
type AccountResult struct {
	Email    string
	Username string
	Password string
	Error    string
}

// generatePassword generates a random secure password using go-password library
func generatePassword(length int) (string, error) {
	// Generate password with: length, numDigits, numSymbols, noUpper, allowRepeat
	// length=12, numDigits=2, numSymbols=2, noUpper=false (allow uppercase), allowRepeat=false
	pass, err := password.Generate(length, 2, 2, false, false)
	if err != nil {
		return "", err
	}
	return pass, nil
}

// generateUsername generates a username from email (part before @)
func generateUsername(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) > 0 {
		// Remove any dots and convert to lowercase
		username := strings.ToLower(strings.ReplaceAll(parts[0], ".", ""))
		// Ensure username is not empty
		if username == "" {
			username = "user" + uuid.New().String()[:8]
		}
		return username
	}
	return "user" + uuid.New().String()[:8]
}

// BatchCreateAccounts handles batch account creation from CSV file (admin only)
func BatchCreateAccounts(c *gin.Context) {
	// Get user context
	userCtx, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing_user_context"})
		return
	}

	userCtxVal, ok := userCtx.(middleware.UserContext)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_user_context"})
		return
	}

	// Check authorization: must be admin
	if !constants.HasAnyRole(userCtxVal.Roles, constants.AdminRoles) {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient_permissions"})
		return
	}

	// Parse multipart form data
	var req BatchAccountRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": err.Error(),
		})
		return
	}

	// Validate file
	if req.CSVFile == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "missing_csv_file",
			"message": "csv_file is required",
		})
		return
	}

	// Validate file size (max 10MB)
	if req.CSVFile.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "file_too_large",
			"message": "CSV file exceeds maximum size of 10MB",
		})
		return
	}

	// Open CSV file
	file, err := req.CSVFile.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_open_file",
			"message": err.Error(),
		})
		return
	}
	defer file.Close()

	// Parse CSV
	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true

	// Read all records
	records, err := reader.ReadAll()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_csv_format",
			"message": err.Error(),
		})
		return
	}

	if len(records) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "empty_csv_file",
			"message": "CSV file is empty",
		})
		return
	}

	// Get student role ID
	var roleID int
	if err := db.DB.Raw("SELECT id FROM roles WHERE name = ?", constants.RoleStudent).Scan(&roleID).Error; err != nil {
		log.Printf("[BATCH_ACCOUNT] Failed to find student role: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_find_student_role",
			"message": "Student role not found",
		})
		return
	}

	// Process each email and create accounts
	var results []AccountResult
	emails := make(map[string]bool) // Track processed emails to avoid duplicates

	for i, record := range records {
		// Skip header row if present (check if first row contains "email" or similar)
		if i == 0 && len(record) > 0 && strings.ToLower(strings.TrimSpace(record[0])) == "email" {
			continue
		}

		// Get email from first column
		if len(record) == 0 || strings.TrimSpace(record[0]) == "" {
			continue
		}

		email := strings.TrimSpace(strings.ToLower(record[0]))

		// Validate email format
		if !strings.Contains(email, "@") || !strings.Contains(email, ".") {
			results = append(results, AccountResult{
				Email: email,
				Error: "invalid_email_format",
			})
			continue
		}

		// Skip if already processed
		if emails[email] {
			results = append(results, AccountResult{
				Email: email,
				Error: "duplicate_email_in_csv",
			})
			continue
		}
		emails[email] = true

		// Check if user already exists
		var existingUser models.User
		if err := db.DB.Where("email = ?", email).First(&existingUser).Error; err == nil {
			results = append(results, AccountResult{
				Email: email,
				Error: "email_already_exists",
			})
			continue
		}

		// Generate username and password
		username := generateUsername(email)
		generatedPassword, err := generatePassword(12) // Generate 12-character password
		if err != nil {
			results = append(results, AccountResult{
				Email: email,
				Error: "failed_to_generate_password",
			})
			continue
		}

		// Hash password
		hash, err := bcrypt.GenerateFromPassword([]byte(generatedPassword), bcrypt.DefaultCost)
		if err != nil {
			results = append(results, AccountResult{
				Email: email,
				Error: "failed_to_hash_password",
			})
			continue
		}

		// Create user
		userID := uuid.NewString()
		user := models.User{
			ID:            userID,
			Email:         email,
			PasswordHash:  string(hash),
			FirstName:     "",
			LastName:      "",
			IsActive:      true,
			EmailVerified: false,
		}

		if err := db.DB.Create(&user).Error; err != nil {
			var mysqlErr *mysqldriver.MySQLError
			if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
				results = append(results, AccountResult{
					Email: email,
					Error: "email_already_exists",
				})
			} else {
				results = append(results, AccountResult{
					Email: email,
					Error: fmt.Sprintf("failed_to_create_user: %v", err),
				})
			}
			continue
		}

		// Assign student role
		if err := db.DB.Exec("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id=user_id", userID, roleID).Error; err != nil {
			log.Printf("[BATCH_ACCOUNT] Failed to assign student role to user %s: %v", userID, err)
			// Continue even if role assignment fails
		}

		// Success
		results = append(results, AccountResult{
			Email:    email,
			Username: username,
			Password: generatedPassword,
		})
	}

	// Generate CSV response
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=accounts.csv")
	c.Status(http.StatusOK)

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Write header
	writer.Write([]string{"email", "username", "password", "error"})

	// Write results
	for _, result := range results {
		errorMsg := result.Error
		if errorMsg == "" {
			errorMsg = "success"
		}
		writer.Write([]string{result.Email, result.Username, result.Password, errorMsg})
	}

	log.Printf("[BATCH_ACCOUNT] Batch account creation completed by user %s: %d total, %d successful",
		userCtxVal.ID, len(results), func() int {
			count := 0
			for _, r := range results {
				if r.Error == "" {
					count++
				}
			}
			return count
		}())
}
