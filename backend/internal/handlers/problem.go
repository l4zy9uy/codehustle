package handlers

import (
	"fmt"
	"log"
	"mime/multipart"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"codehustle/backend/internal/constants"
	"codehustle/backend/internal/middleware"
	"codehustle/backend/internal/models"
	"codehustle/backend/internal/repository"
	"codehustle/backend/internal/storage"
	"codehustle/backend/internal/utils"
)

// ListProblems returns a list of problems
func ListProblems(c *gin.Context) {
	// Get user context to check if they're admin/lecturer (can see private problems)
	userCtx, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing_user_context"})
		return
	}

	// Check if user is admin or lecturer to show all problems
	isPublicOnly := true
	if userCtxVal, ok := userCtx.(middleware.UserContext); ok {
		log.Printf("[PROBLEM] User roles: %v", userCtxVal.Roles)
		if constants.HasAnyRole(userCtxVal.Roles, constants.PrivilegedRoles) {
			isPublicOnly = false
			log.Printf("[PROBLEM] User has privileged role, showing all problems")
		}
	}

	log.Printf("[PROBLEM] Query filter: isPublicOnly = %v", isPublicOnly)

	problems, err := repository.ListProblems(isPublicOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_fetch_problems",
			"message": err.Error(),
		})
		return
	}

	log.Printf("[PROBLEM] Found %d problems", len(problems))
	c.JSON(http.StatusOK, gin.H{"problems": problems})
}

// GetProblem returns a single problem by ID or slug
func GetProblem(c *gin.Context) {
	identifier := c.Param("id")
	if identifier == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_problem_identifier"})
		return
	}

	problem, err := repository.GetProblem(identifier)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "problem_not_found",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"problem": problem})
}

// CreateProblemRequest represents the expected payload for creating a problem
// Note: This is multipart form data, not JSON
type CreateProblemRequest struct {
	Title         string                `form:"title" binding:"required"`
	Slug          string                `form:"slug"` // Optional, will be auto-generated from title if not provided
	StatementFile *multipart.FileHeader `form:"statement_file" binding:"required"`
	Difficulty    string                `form:"difficulty"`
	IsPublic      bool                  `form:"is_public"`
	TimeLimitMs   int                   `form:"time_limit_ms"`
	MemoryLimitKb int                   `form:"memory_limit_kb"`
}

// CreateProblem creates a new problem (admin/lecturer only)
func CreateProblem(c *gin.Context) {
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

	// Parse multipart form data
	var req CreateProblemRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": err.Error(),
		})
		return
	}

	// Validate file
	if req.StatementFile == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "missing_statement_file",
			"message": "statement_file is required",
		})
		return
	}

	// Set defaults for optional fields
	timeLimitMs := req.TimeLimitMs
	if timeLimitMs == 0 {
		timeLimitMs = 2000 // Default 2 seconds
	}

	memoryLimitKb := req.MemoryLimitKb
	if memoryLimitKb == 0 {
		memoryLimitKb = 262144 // Default 256 MB
	}

	// Generate problem ID and slug
	problemID := uuid.NewString()
	slug := req.Slug
	if slug == "" {
		slug = utils.GenerateSlug(req.Title)
	}

	// Generate object key for MinIO (e.g., "problems/{problem-id}/statement.md")
	objectKey := fmt.Sprintf("problems/%s/%s", problemID, req.StatementFile.Filename)

	// Open uploaded file
	file, err := req.StatementFile.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_open_file",
			"message": err.Error(),
		})
		return
	}
	defer file.Close()

	// Upload file to MinIO
	bucketName := storage.GetProblemStatementsBucket()
	contentType := req.StatementFile.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	if err := storage.UploadFile(bucketName, objectKey, file, req.StatementFile.Size, contentType); err != nil {
		log.Printf("[PROBLEM] Failed to upload statement file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_upload_file",
			"message": err.Error(),
		})
		return
	}

	// Create problem model
	problem := models.Problem{
		ID:            problemID,
		Title:         req.Title,
		Slug:          slug,      // Will be validated for uniqueness by repository
		StatementPath: objectKey, // MinIO object key
		Difficulty:    req.Difficulty,
		IsPublic:      req.IsPublic,
		TimeLimitMs:   timeLimitMs,
		MemoryLimitKb: memoryLimitKb,
		CreatedBy:     userCtxVal.ID,
	}

	// Create problem (slug uniqueness will be handled by repository)
	if err := repository.CreateProblem(&problem); err != nil {
		log.Printf("[PROBLEM] Failed to create problem: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_create_problem",
			"message": err.Error(),
		})
		return
	}

	log.Printf("[PROBLEM] Created problem '%s' (ID: %s, Slug: %s) by user %s", problem.Title, problem.ID, problem.Slug, userCtxVal.ID)
	c.JSON(http.StatusCreated, gin.H{"problem": problem})
}

// UpdateProblemRequest represents the expected payload for updating a problem
type UpdateProblemRequest struct {
	Title         string                `form:"title"`
	Slug          string                `form:"slug"`
	StatementFile *multipart.FileHeader `form:"statement_file"`
	Difficulty    string                `form:"difficulty"`
	IsPublic      *bool                 `form:"is_public"`
	TimeLimitMs   int                   `form:"time_limit_ms"`
	MemoryLimitKb int                   `form:"memory_limit_kb"`
}

// UpdateProblem updates an existing problem (admin/instructor only)
func UpdateProblem(c *gin.Context) {
	identifier := c.Param("id")
	if identifier == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_problem_identifier"})
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

	// Get existing problem
	existingProblem, err := repository.GetProblem(identifier)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "problem_not_found",
			"message": err.Error(),
		})
		return
	}

	// Check authorization: user must be admin or the creator
	isAdmin := constants.HasAnyRole(userCtxVal.Roles, constants.AdminRoles)
	isOwner := existingProblem.CreatedBy == userCtxVal.ID

	if !isAdmin && !isOwner {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "insufficient_permissions",
			"message": "You can only update problems you created unless you are an admin",
		})
		return
	}

	// Parse multipart form data
	var req UpdateProblemRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": err.Error(),
		})
		return
	}

	// Update fields if provided
	if req.Title != "" {
		existingProblem.Title = req.Title
	}
	if req.Slug != "" {
		existingProblem.Slug = req.Slug
	}
	if req.Difficulty != "" {
		existingProblem.Difficulty = req.Difficulty
	}
	if req.IsPublic != nil {
		existingProblem.IsPublic = *req.IsPublic
	}
	if req.TimeLimitMs > 0 {
		existingProblem.TimeLimitMs = req.TimeLimitMs
	}
	if req.MemoryLimitKb > 0 {
		existingProblem.MemoryLimitKb = req.MemoryLimitKb
	}

	// Handle statement file update if provided
	if req.StatementFile != nil {
		// Generate new object key for the updated file
		objectKey := fmt.Sprintf("problems/%s/%s", existingProblem.ID, req.StatementFile.Filename)

		file, err := req.StatementFile.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "failed_to_open_file",
				"message": err.Error(),
			})
			return
		}
		defer file.Close()

		bucketName := storage.GetProblemStatementsBucket()
		contentType := req.StatementFile.Header.Get("Content-Type")
		if contentType == "" {
			contentType = "application/octet-stream"
		}

		if err := storage.UploadFile(bucketName, objectKey, file, req.StatementFile.Size, contentType); err != nil {
			log.Printf("[PROBLEM] Failed to upload statement file: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "failed_to_upload_file",
				"message": err.Error(),
			})
			return
		}

		existingProblem.StatementPath = objectKey
	}

	// Update problem
	if err := repository.UpdateProblem(existingProblem); err != nil {
		log.Printf("[PROBLEM] Failed to update problem: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_update_problem",
			"message": err.Error(),
		})
		return
	}

	log.Printf("[PROBLEM] Updated problem '%s' (ID: %s) by user %s", existingProblem.Title, existingProblem.ID, userCtxVal.ID)
	c.JSON(http.StatusOK, gin.H{"problem": existingProblem})
}

// DeleteProblem performs a soft delete on a problem (admin/instructor only)
func DeleteProblem(c *gin.Context) {
	identifier := c.Param("id")
	if identifier == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_problem_identifier"})
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

	// Verify problem exists
	problem, err := repository.GetProblem(identifier)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "problem_not_found",
			"message": err.Error(),
		})
		return
	}

	// Check authorization: user must be admin or the creator
	isAdmin := constants.HasAnyRole(userCtxVal.Roles, constants.AdminRoles)
	isOwner := problem.CreatedBy == userCtxVal.ID

	if !isAdmin && !isOwner {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "insufficient_permissions",
			"message": "You can only delete problems you created unless you are an admin",
		})
		return
	}

	// Perform soft delete
	if err := repository.DeleteProblem(problem.ID); err != nil {
		log.Printf("[PROBLEM] Failed to delete problem: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_delete_problem",
			"message": err.Error(),
		})
		return
	}

	log.Printf("[PROBLEM] Deleted problem '%s' (ID: %s) by user %s", problem.Title, problem.ID, userCtxVal.ID)
	c.JSON(http.StatusOK, gin.H{"message": "problem deleted successfully"})
}
