package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
	"golang.org/x/crypto/bcrypt"

	"codehustle/backend/internal/constants"
	"codehustle/backend/internal/middleware"
	"codehustle/backend/internal/models"
	"codehustle/backend/internal/repository"
)

// AdminUserResponse represents a user response for admin endpoints
type AdminUserResponse struct {
	ID            string   `json:"id"`
	Email         string   `json:"email"`
	FirstName     string   `json:"first_name"`
	LastName      string   `json:"last_name"`
	IsActive      bool     `json:"is_active"`
	EmailVerified bool     `json:"email_verified"`
	LastLoginAt   *string  `json:"last_login_at,omitempty"`
	CreatedAt     string   `json:"created_at"`
	UpdatedAt     string   `json:"updated_at"`
	Roles         []string `json:"roles"`
}

// CreateUserRequest represents the request for creating a user
type CreateUserRequest struct {
	Email     string   `json:"email" binding:"required,email"`
	Password  string   `json:"password" binding:"required,min=8"`
	FirstName string   `json:"first_name"`
	LastName  string   `json:"last_name"`
	IsActive  *bool    `json:"is_active"`
	Roles     []string `json:"roles"`
}

// UpdateUserRequest represents the request for updating a user
type UpdateUserRequest struct {
	Email         *string  `json:"email"`
	Password      *string  `json:"password"`
	FirstName     *string  `json:"first_name"`
	LastName      *string  `json:"last_name"`
	IsActive      *bool    `json:"is_active"`
	EmailVerified *bool    `json:"email_verified"`
	Roles         []string `json:"roles"`
}

// DeleteUsersRequest represents the request for deleting users
type DeleteUsersRequest struct {
	UserIDs []string `json:"user_ids" binding:"required"`
}

// ListAdminUsers handles GET /api/v1/admin/users - list or get user by ID
func ListAdminUsers(c *gin.Context) {
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

	// Check if requesting single user by ID
	userID := c.Query("id")
	if userID != "" {
		user, roles, err := repository.GetUserByID(userID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "user_not_found",
				"message": err.Error(),
			})
			return
		}

		lastLoginAt := ""
		if user.LastLoginAt != nil {
			lastLoginAt = user.LastLoginAt.Format("2006-01-02T15:04:05Z07:00")
		}

		response := AdminUserResponse{
			ID:            user.ID,
			Email:         user.Email,
			FirstName:     user.FirstName,
			LastName:      user.LastName,
			IsActive:      user.IsActive,
			EmailVerified: user.EmailVerified,
			LastLoginAt:   &lastLoginAt,
			CreatedAt:     user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:     user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
			Roles:         roles,
		}

		c.JSON(http.StatusOK, response)
		return
	}

	// List users with pagination
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "25")
	keyword := c.Query("keyword")

	pageNum, err := strconv.Atoi(page)
	if err != nil || pageNum < 1 {
		pageNum = 1
	}

	pageSizeNum, err := strconv.Atoi(pageSize)
	if err != nil || pageSizeNum < 1 {
		pageSizeNum = 25
	}
	if pageSizeNum > 100 {
		pageSizeNum = 100
	}

	result, err := repository.ListUsers(pageNum, pageSizeNum, keyword)
	if err != nil {
		log.Printf("[ADMIN_USER] Failed to list users: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_fetch_users",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// ExportUsers exports users to Excel file (Admin only)
func ExportUsers(c *gin.Context) {
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

	// Get all users (no pagination for export)
	result, err := repository.ListUsers(1, 10000, "")
	if err != nil {
		log.Printf("[ADMIN_USER] Failed to list users for export: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_fetch_users",
			"message": err.Error(),
		})
		return
	}

	// Create Excel file
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			log.Printf("[ADMIN_USER] Failed to close Excel file: %v", err)
		}
	}()

	sheetName := "Users"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		log.Printf("[ADMIN_USER] Failed to create sheet: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_create_excel"})
		return
	}

	// Set active sheet
	f.SetActiveSheet(index)

	// Delete default sheet
	f.DeleteSheet("Sheet1")

	// Set headers
	headers := []string{"ID", "Email", "First Name", "Last Name", "Is Active", "Email Verified", "Last Login At", "Created At", "Roles"}
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	// Style headers
	headerStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#E0E0E0"}, Pattern: 1},
	})
	if err == nil {
		f.SetCellStyle(sheetName, "A1", fmt.Sprintf("%c1", 'A'+len(headers)-1), headerStyle)
	}

	// Write data
	for i, user := range result.Users {
		row := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), user.ID)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), user.Email)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), user.FirstName)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), user.LastName)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), user.IsActive)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), user.EmailVerified)
		if user.LastLoginAt != nil {
			f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), *user.LastLoginAt)
		}
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), user.CreatedAt)
		f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), strings.Join(user.Roles, ", "))
	}

	// Auto-fit columns
	for i := 0; i < len(headers); i++ {
		col := string(rune('A' + i))
		f.SetColWidth(sheetName, col, col, 15)
	}

	// Set response headers
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename=users.xlsx")
	c.Header("Content-Transfer-Encoding", "binary")

	// Write Excel file to response
	if err := f.Write(c.Writer); err != nil {
		log.Printf("[ADMIN_USER] Failed to write Excel file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_write_excel"})
		return
	}

	log.Printf("[ADMIN_USER] Exported %d users to Excel by admin %s", len(result.Users), userCtxVal.ID)
}

// CreateAdminUser handles POST /api/v1/admin/users - create a new user
func CreateAdminUser(c *gin.Context) {
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

	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": err.Error(),
		})
		return
	}

	// Check if user already exists
	existingUser, _ := repository.GetUserByEmail(req.Email)
	if existingUser != nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "email_already_exists",
			"message": fmt.Sprintf("User with email '%s' already exists", req.Email),
		})
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_hash_password",
			"message": err.Error(),
		})
		return
	}

	// Set defaults
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	// Create user
	userID := uuid.NewString()
	user := &models.User{
		ID:            userID,
		Email:         req.Email,
		PasswordHash:  string(hash),
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		IsActive:      isActive,
		EmailVerified: false,
	}

	if err := repository.CreateUser(user); err != nil {
		log.Printf("[ADMIN_USER] Failed to create user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_create_user",
			"message": err.Error(),
		})
		return
	}

	// Assign roles
	if len(req.Roles) > 0 {
		if err := repository.SetUserRoles(userID, req.Roles); err != nil {
			log.Printf("[ADMIN_USER] Failed to assign roles: %v", err)
			// Continue even if role assignment fails
		}
	} else {
		// Default to student role if no roles specified
		if err := repository.AssignRole(userID, constants.RoleStudent); err != nil {
			log.Printf("[ADMIN_USER] Failed to assign default student role: %v", err)
		}
	}

	log.Printf("[ADMIN_USER] Created user %s by admin %s", userID, userCtxVal.ID)

	// Get created user with roles
	createdUser, roles, err := repository.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusCreated, gin.H{
			"id":      userID,
			"email":   req.Email,
			"message": "User created successfully",
		})
		return
	}

	lastLoginAt := ""
	if createdUser.LastLoginAt != nil {
		lastLoginAt = createdUser.LastLoginAt.Format("2006-01-02T15:04:05Z07:00")
	}

	response := AdminUserResponse{
		ID:            createdUser.ID,
		Email:         createdUser.Email,
		FirstName:     createdUser.FirstName,
		LastName:      createdUser.LastName,
		IsActive:      createdUser.IsActive,
		EmailVerified: createdUser.EmailVerified,
		LastLoginAt:   &lastLoginAt,
		CreatedAt:     createdUser.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:     createdUser.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		Roles:         roles,
	}

	c.JSON(http.StatusCreated, response)
}

// UpdateAdminUser handles PUT /api/v1/admin/users/:id - update a user
func UpdateAdminUser(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_user_id"})
		return
	}

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

	// Verify user exists
	existingUser, _, err := repository.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "user_not_found",
			"message": err.Error(),
		})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": err.Error(),
		})
		return
	}

	// Update fields if provided
	updates := make(map[string]interface{})
	if req.Email != nil && *req.Email != existingUser.Email {
		// Check if new email already exists
		emailUser, _ := repository.GetUserByEmail(*req.Email)
		if emailUser != nil && emailUser.ID != userID {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "email_already_exists",
				"message": fmt.Sprintf("User with email '%s' already exists", *req.Email),
			})
			return
		}
		updates["email"] = *req.Email
	}
	if req.FirstName != nil {
		updates["first_name"] = *req.FirstName
	}
	if req.LastName != nil {
		updates["last_name"] = *req.LastName
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}
	if req.EmailVerified != nil {
		updates["email_verified"] = *req.EmailVerified
	}
	if req.Password != nil {
		hash, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "failed_to_hash_password",
				"message": err.Error(),
			})
			return
		}
		updates["password_hash"] = string(hash)
	}

	// Update user
	if len(updates) > 0 {
		// Apply updates to existing user
		if email, ok := updates["email"].(string); ok {
			existingUser.Email = email
		}
		if firstName, ok := updates["first_name"].(string); ok {
			existingUser.FirstName = firstName
		}
		if lastName, ok := updates["last_name"].(string); ok {
			existingUser.LastName = lastName
		}
		if isActive, ok := updates["is_active"].(bool); ok {
			existingUser.IsActive = isActive
		}
		if emailVerified, ok := updates["email_verified"].(bool); ok {
			existingUser.EmailVerified = emailVerified
		}
		if passwordHash, ok := updates["password_hash"].(string); ok {
			existingUser.PasswordHash = passwordHash
		}
		if err := repository.UpdateUser(existingUser); err != nil {
			log.Printf("[ADMIN_USER] Failed to update user: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "failed_to_update_user",
				"message": err.Error(),
			})
			return
		}
	}

	// Update roles if provided
	if req.Roles != nil {
		if err := repository.SetUserRoles(userID, req.Roles); err != nil {
			log.Printf("[ADMIN_USER] Failed to update roles: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "failed_to_update_roles",
				"message": err.Error(),
			})
			return
		}
	}

	log.Printf("[ADMIN_USER] Updated user %s by admin %s", userID, userCtxVal.ID)

	// Get updated user with roles
	updatedUser, roles, err := repository.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "User updated successfully",
			"id":      userID,
		})
		return
	}

	lastLoginAt := ""
	if updatedUser.LastLoginAt != nil {
		lastLoginAt = updatedUser.LastLoginAt.Format("2006-01-02T15:04:05Z07:00")
	}

	response := AdminUserResponse{
		ID:            updatedUser.ID,
		Email:         updatedUser.Email,
		FirstName:     updatedUser.FirstName,
		LastName:      updatedUser.LastName,
		IsActive:      updatedUser.IsActive,
		EmailVerified: updatedUser.EmailVerified,
		LastLoginAt:   &lastLoginAt,
		CreatedAt:     updatedUser.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:     updatedUser.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		Roles:         roles,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteAdminUsers handles DELETE /api/v1/admin/users (bulk) and DELETE /api/v1/admin/users/:id (single)
func DeleteAdminUsers(c *gin.Context) {
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

	// Check if deleting single user (from URL param) or bulk (from body)
	userID := c.Param("id")
	var userIDs []string

	if userID != "" {
		// Single user deletion via URL parameter
		userIDs = []string{userID}
	} else {
		// Bulk deletion via request body
		var req DeleteUsersRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "invalid_request",
				"message": err.Error(),
			})
			return
		}

		if len(req.UserIDs) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "missing_user_ids",
				"message": "At least one user ID is required",
			})
			return
		}

		userIDs = req.UserIDs
	}

	// Delete users
	if err := repository.DeleteUsersBatch(userIDs); err != nil {
		log.Printf("[ADMIN_USER] Failed to delete users: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_delete_users",
			"message": err.Error(),
		})
		return
	}

	log.Printf("[ADMIN_USER] Deleted %d users by admin %s", len(userIDs), userCtxVal.ID)
	c.JSON(http.StatusOK, gin.H{
		"message":     "Users deleted successfully",
		"deleted_ids": userIDs,
		"count":       len(userIDs),
	})
}
