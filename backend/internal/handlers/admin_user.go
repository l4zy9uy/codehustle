package handlers

import (
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
			"error":   "failed_to_list_users",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
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

	// Check if email already exists
	existingUser, _ := repository.GetUserByEmail(req.Email)
	if existingUser != nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "email_already_exists",
			"message": "An account with this email already exists",
		})
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could_not_hash_password"})
		return
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	// Create user
	userID := uuid.NewString()
	user := models.User{
		ID:            userID,
		Email:         req.Email,
		PasswordHash:  string(hash),
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		IsActive:      isActive,
		EmailVerified: false,
	}

	if err := repository.CreateUser(&user); err != nil {
		log.Printf("[ADMIN_USER] Failed to create user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_create_user",
			"message": err.Error(),
		})
		return
	}

	// Assign roles if provided
	if len(req.Roles) > 0 {
		if err := repository.SetUserRoles(userID, req.Roles); err != nil {
			log.Printf("[ADMIN_USER] Failed to assign roles: %v", err)
			// Continue even if role assignment fails
		}
	} else {
		// Assign default student role
		if err := repository.AssignRole(userID, constants.RoleStudent); err != nil {
			log.Printf("[ADMIN_USER] Failed to assign default student role: %v", err)
		}
	}

	// Fetch user with roles for response
	createdUser, roles, _ := repository.GetUserByID(userID)

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

	log.Printf("[ADMIN_USER] Created user %s (%s) by admin %s", userID, req.Email, userCtxVal.ID)
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

	// Get existing user
	user, _, err := repository.GetUserByID(userID)
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
	if req.Email != nil {
		// Check if email already exists (excluding current user)
		existingUser, _ := repository.GetUserByEmail(*req.Email)
		if existingUser != nil && existingUser.ID != userID {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "email_already_exists",
				"message": "An account with this email already exists",
			})
			return
		}
		user.Email = *req.Email
	}

	if req.Password != nil && *req.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could_not_hash_password"})
			return
		}
		user.PasswordHash = string(hash)
	}

	if req.FirstName != nil {
		user.FirstName = *req.FirstName
	}

	if req.LastName != nil {
		user.LastName = *req.LastName
	}

	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	if req.EmailVerified != nil {
		user.EmailVerified = *req.EmailVerified
	}

	// Update user
	if err := repository.UpdateUser(user); err != nil {
		log.Printf("[ADMIN_USER] Failed to update user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_update_user",
			"message": err.Error(),
		})
		return
	}

	// Update roles if provided
	if req.Roles != nil {
		if err := repository.SetUserRoles(userID, req.Roles); err != nil {
			log.Printf("[ADMIN_USER] Failed to update roles: %v", err)
			// Continue even if role update fails
		}
	}

	// Fetch updated user with roles
	updatedUser, roles, _ := repository.GetUserByID(userID)

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

	log.Printf("[ADMIN_USER] Updated user %s by admin %s", userID, userCtxVal.ID)
	c.JSON(http.StatusOK, response)
}

// DeleteAdminUsers handles DELETE /api/v1/admin/users - delete user(s)
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

	// Check if deleting single user via URL param
	userID := c.Param("id")
	var userIDs []string

	if userID != "" {
		// Single user deletion via URL parameter
		userIDs = []string{userID}
	} else {
		// Bulk deletion via query parameter (comma-separated) or request body
		idsParam := c.Query("id")
		if idsParam != "" {
			// Comma-separated IDs in query param (like QDUOJ)
			userIDs = strings.Split(idsParam, ",")
		} else {
			// Try request body
			var req DeleteUsersRequest
			if err := c.ShouldBindJSON(&req); err == nil && len(req.UserIDs) > 0 {
				userIDs = req.UserIDs
			} else {
				c.JSON(http.StatusBadRequest, gin.H{
					"error":   "missing_user_ids",
					"message": "User ID(s) required via URL param, query param, or request body",
				})
				return
			}
		}
	}

	// Prevent self-deletion
	for _, id := range userIDs {
		if id == userCtxVal.ID {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "cannot_delete_self",
				"message": "You cannot delete your own account",
			})
			return
		}
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

	log.Printf("[ADMIN_USER] Deleted %d user(s) by admin %s", len(userIDs), userCtxVal.ID)
	c.JSON(http.StatusOK, gin.H{
		"message":     "Users deleted successfully",
		"deleted_ids": userIDs,
		"count":       len(userIDs),
	})
}
