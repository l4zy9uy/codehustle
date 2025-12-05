package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"mime/multipart"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"codehustle/backend/internal/middleware"
	"codehustle/backend/internal/models"
	"codehustle/backend/internal/repository"
	"codehustle/backend/internal/storage"
	"codehustle/backend/internal/utils"
)

// AdminListProblems returns a paginated list of all problems (Admin only)
func AdminListProblems(c *gin.Context) {
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "25")

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

	log.Printf("[ADMIN_PROBLEM] AdminListProblems: page=%d, pageSize=%d", pageNum, pageSizeNum)

	// Admin can see all problems (public and private)
	result, err := repository.ListProblems(false, pageNum, pageSizeNum)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_fetch_problems",
			"message": err.Error(),
		})
		return
	}

	log.Printf("[ADMIN_PROBLEM] AdminListProblems response: total=%d, returned=%d", result.Total, len(result.Problems))
	c.JSON(http.StatusOK, result)
}

// AdminGetProblem returns a single problem by ID (Admin only)
func AdminGetProblem(c *gin.Context) {
	identifier := c.Param("id")
	if identifier == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_problem_identifier"})
		return
	}

	problem, tags, err := repository.GetProblemWithTags(identifier)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "problem_not_found",
			"message": err.Error(),
		})
		return
	}

	// Retrieve problem statement content from MinIO
	bucketName := storage.GetProblemStatementsBucket()
	statementContent, err := storage.GetFile(bucketName, problem.StatementPath)
	if err != nil {
		log.Printf("[ADMIN_PROBLEM] Failed to retrieve statement file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_load_statement",
			"message": err.Error(),
		})
		return
	}

	// Build response
	response := GetProblemResponse{
		ID:          problem.ID,
		Code:        problem.Slug,
		Name:        problem.Title,
		Types:       tags,
		Diff:        problem.Difficulty,
		TimeLimit:   problem.TimeLimitMs / 1000,
		MemoryLimit: int64(problem.MemoryLimitKb) * 1024,
		Body:        string(statementContent),
	}

	c.JSON(http.StatusOK, response)
}

// AdminCreateProblem creates a new problem (Admin only)
func AdminCreateProblem(c *gin.Context) {
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

	var req CreateProblemRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": err.Error(),
		})
		return
	}

	// Generate slug if not provided
	slug := req.Slug
	if slug == "" {
		slug = utils.GenerateSlug(req.Title)
	}

	// Check if slug already exists
	existingProblem, _ := repository.GetProblemBySlug(slug)
	if existingProblem != nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "slug_already_exists",
			"message": fmt.Sprintf("Problem with slug '%s' already exists", slug),
		})
		return
	}

	problemID := uuid.NewString()

	// Upload statement file to MinIO
	bucketName := storage.GetProblemStatementsBucket()
	statementKey := fmt.Sprintf("problems/%s/statement.md", problemID)

	statementFile, err := req.StatementFile.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "failed_to_open_file",
			"message": err.Error(),
		})
		return
	}
	defer statementFile.Close()

	stat, _ := req.StatementFile.Open()
	fileSize := req.StatementFile.Size
	stat.Close()

	if err := storage.UploadFile(bucketName, statementKey, statementFile, fileSize, "text/markdown"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_upload_statement",
			"message": err.Error(),
		})
		return
	}

	// Set defaults
	timeLimitMs := req.TimeLimitMs
	if timeLimitMs == 0 {
		timeLimitMs = 2000 // Default 2 seconds
	}

	memoryLimitKb := req.MemoryLimitKb
	if memoryLimitKb == 0 {
		memoryLimitKb = 262144 // Default 256MB
	}

	// Create problem
	problem := &models.Problem{
		ID:            problemID,
		Title:         req.Title,
		Slug:          slug,
		StatementPath: statementKey,
		Difficulty:    req.Difficulty,
		IsPublic:      req.IsPublic,
		TimeLimitMs:   timeLimitMs,
		MemoryLimitKb: memoryLimitKb,
		CreatedBy:     userCtxVal.ID,
	}

	if err := repository.CreateProblem(problem); err != nil {
		log.Printf("[ADMIN_PROBLEM] Failed to create problem: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_create_problem",
			"message": err.Error(),
		})
		return
	}

	log.Printf("[ADMIN_PROBLEM] Created problem %s by admin %s", problemID, userCtxVal.ID)
	c.JSON(http.StatusCreated, gin.H{
		"id":    problemID,
		"slug":  slug,
		"title": req.Title,
	})
}

// AdminUpdateProblemRequest represents the expected payload for updating a problem
type AdminUpdateProblemRequest struct {
	Title         string                `form:"title"`
	Slug          string                `form:"slug"`
	StatementFile *multipart.FileHeader `form:"statement_file"`
	Difficulty    string                `form:"difficulty"`
	IsPublic      *bool                 `form:"is_public"`
	TimeLimitMs   int                   `form:"time_limit_ms"`
	MemoryLimitKb int                   `form:"memory_limit_kb"`
}

// AdminUpdateProblem updates an existing problem (Admin only)
func AdminUpdateProblem(c *gin.Context) {
	problemID := c.Param("id")
	if problemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_problem_id"})
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
	problem, err := repository.GetProblem(problemID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "problem_not_found",
			"message": err.Error(),
		})
		return
	}

	var req AdminUpdateProblemRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": err.Error(),
		})
		return
	}

	updates := make(map[string]interface{})

	// Update title if provided
	if req.Title != "" {
		updates["title"] = req.Title
	}

	// Update slug if provided
	if req.Slug != "" && req.Slug != problem.Slug {
		// Check if new slug already exists
		existingProblem, _ := repository.GetProblemBySlug(req.Slug)
		if existingProblem != nil && existingProblem.ID != problemID {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "slug_already_exists",
				"message": fmt.Sprintf("Problem with slug '%s' already exists", req.Slug),
			})
			return
		}
		updates["slug"] = req.Slug
	}

	// Update statement file if provided
	if req.StatementFile != nil {
		bucketName := storage.GetProblemStatementsBucket()
		statementKey := fmt.Sprintf("problems/%s/statement.md", problemID)

		statementFile, err := req.StatementFile.Open()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "failed_to_open_file",
				"message": err.Error(),
			})
			return
		}
		defer statementFile.Close()

		fileSize := req.StatementFile.Size
		if err := storage.UploadFile(bucketName, statementKey, statementFile, fileSize, "text/markdown"); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "failed_to_upload_statement",
				"message": err.Error(),
			})
			return
		}
		updates["statement_path"] = statementKey
	}

	// Update difficulty if provided
	if req.Difficulty != "" {
		updates["difficulty"] = req.Difficulty
	}

	// Update is_public if provided
	if req.IsPublic != nil {
		updates["is_public"] = *req.IsPublic
	}

	// Update time limit if provided
	if req.TimeLimitMs > 0 {
		updates["time_limit_ms"] = req.TimeLimitMs
	}

	// Update memory limit if provided
	if req.MemoryLimitKb > 0 {
		updates["memory_limit_kb"] = req.MemoryLimitKb
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "no_updates",
			"message": "No fields to update",
		})
		return
	}

	// Update problem using the existing pattern
	existingProblem, err := repository.GetProblem(problemID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "problem_not_found",
			"message": err.Error(),
		})
		return
	}

	// Apply updates to existing problem
	if title, ok := updates["title"].(string); ok {
		existingProblem.Title = title
	}
	if slug, ok := updates["slug"].(string); ok {
		existingProblem.Slug = slug
	}
	if difficulty, ok := updates["difficulty"].(string); ok {
		existingProblem.Difficulty = difficulty
	}
	if isPublic, ok := updates["is_public"].(bool); ok {
		existingProblem.IsPublic = isPublic
	}
	if timeLimitMs, ok := updates["time_limit_ms"].(int); ok {
		existingProblem.TimeLimitMs = timeLimitMs
	}
	if memoryLimitKb, ok := updates["memory_limit_kb"].(int); ok {
		existingProblem.MemoryLimitKb = memoryLimitKb
	}
	if statementPath, ok := updates["statement_path"].(string); ok {
		existingProblem.StatementPath = statementPath
	}

	if err := repository.UpdateProblem(existingProblem); err != nil {
		log.Printf("[ADMIN_PROBLEM] Failed to update problem: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_update_problem",
			"message": err.Error(),
		})
		return
	}

	log.Printf("[ADMIN_PROBLEM] Updated problem %s by admin %s", problemID, userCtxVal.ID)
	c.JSON(http.StatusOK, gin.H{
		"message": "Problem updated successfully",
		"id":      problemID,
	})
}

// AdminDeleteProblem deletes a problem (Admin only)
func AdminDeleteProblem(c *gin.Context) {
	problemID := c.Param("id")
	if problemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_problem_id"})
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
	_, err := repository.GetProblem(problemID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "problem_not_found",
			"message": err.Error(),
		})
		return
	}

	if err := repository.DeleteProblem(problemID); err != nil {
		log.Printf("[ADMIN_PROBLEM] Failed to delete problem: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_delete_problem",
			"message": err.Error(),
		})
		return
	}

	log.Printf("[ADMIN_PROBLEM] Deleted problem %s by admin %s", problemID, userCtxVal.ID)
	c.JSON(http.StatusOK, gin.H{
		"message": "Problem deleted successfully",
		"id":      problemID,
	})
}

// ProblemExport represents the export format for a problem
type ProblemExport struct {
	Problem   models.Problem    `json:"problem"`
	Tags      []string          `json:"tags"`
	TestCases []models.TestCase `json:"test_cases"`
	Statement string            `json:"statement"`
}

// AdminExportProblem exports a problem as JSON (Admin only)
func AdminExportProblem(c *gin.Context) {
	problemID := c.Param("id")
	if problemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_problem_id"})
		return
	}

	// Get problem with tags
	problem, tags, err := repository.GetProblemWithTags(problemID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "problem_not_found",
			"message": err.Error(),
		})
		return
	}

	// Get test cases
	testCases, err := repository.GetTestCasesByProblemID(problemID)
	if err != nil {
		log.Printf("[ADMIN_PROBLEM] Failed to get test cases: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_fetch_test_cases",
			"message": err.Error(),
		})
		return
	}

	// Get statement content
	bucketName := storage.GetProblemStatementsBucket()
	statementContent, err := storage.GetFile(bucketName, problem.StatementPath)
	if err != nil {
		log.Printf("[ADMIN_PROBLEM] Failed to retrieve statement: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_load_statement",
			"message": err.Error(),
		})
		return
	}

	// Download test case files from MinIO
	testCasesBucket := storage.GetTestCasesBucket()
	for i := range testCases {
		tc := &testCases[i]
		if tc.InputPath != "" {
			if content, err := storage.GetFile(testCasesBucket, tc.InputPath); err == nil {
				tc.InputPath = string(content) // Store content temporarily
			}
		}
		if tc.ExpectedOutputPath != "" && !utils.Contains(tc.ExpectedOutputPath, ".placeholder") {
			if content, err := storage.GetFile(testCasesBucket, tc.ExpectedOutputPath); err == nil {
				tc.ExpectedOutputPath = string(content) // Store content temporarily
			}
		}
	}

	export := ProblemExport{
		Problem:   *problem,
		Tags:      tags,
		TestCases: testCases,
		Statement: string(statementContent),
	}

	c.Header("Content-Type", "application/json")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=problem_%s.json", problemID))
	c.JSON(http.StatusOK, export)
}

// AdminImportProblemRequest represents the import request
type AdminImportProblemRequest struct {
	File *multipart.FileHeader `form:"file" binding:"required"`
}

// AdminImportProblem imports a problem from JSON (Admin only)
func AdminImportProblem(c *gin.Context) {
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

	var req AdminImportProblemRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": err.Error(),
		})
		return
	}

	// Read JSON file
	file, err := req.File.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "failed_to_open_file",
			"message": err.Error(),
		})
		return
	}
	defer file.Close()

	var export ProblemExport
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&export); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_json",
			"message": err.Error(),
		})
		return
	}

	// Generate new problem ID
	newProblemID := uuid.NewString()

	// Upload statement to MinIO
	bucketName := storage.GetProblemStatementsBucket()
	statementKey := fmt.Sprintf("problems/%s/statement.md", newProblemID)
	statementBytes := []byte(export.Statement)
	statementReader := &utils.ByteReader{Data: statementBytes}
	if err := storage.UploadFile(bucketName, statementKey, statementReader, int64(len(statementBytes)), "text/markdown"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_upload_statement",
			"message": err.Error(),
		})
		return
	}

	// Create problem
	problem := &models.Problem{
		ID:            newProblemID,
		Title:         export.Problem.Title,
		Slug:          export.Problem.Slug,
		StatementPath: statementKey,
		Difficulty:    export.Problem.Difficulty,
		IsPublic:      export.Problem.IsPublic,
		TimeLimitMs:   export.Problem.TimeLimitMs,
		MemoryLimitKb: export.Problem.MemoryLimitKb,
		CreatedBy:     userCtxVal.ID,
	}

	if err := repository.CreateProblem(problem); err != nil {
		log.Printf("[ADMIN_PROBLEM] Failed to create problem: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_create_problem",
			"message": err.Error(),
		})
		return
	}

	// Upload test cases
	testCasesBucket := storage.GetTestCasesBucket()
	for _, tc := range export.TestCases {
		testCaseID := uuid.NewString()
		inputKey := fmt.Sprintf("problems/%s/test_cases/%s/input.txt", newProblemID, testCaseID)
		outputKey := fmt.Sprintf("problems/%s/test_cases/%s/output.txt", newProblemID, testCaseID)

		// Upload input
		if tc.InputPath != "" {
			inputBytes := []byte(tc.InputPath) // Content was stored in InputPath during export
			inputReader := &utils.ByteReader{Data: inputBytes}
			if err := storage.UploadFile(testCasesBucket, inputKey, inputReader, int64(len(inputBytes)), "text/plain"); err != nil {
				log.Printf("[ADMIN_PROBLEM] Failed to upload input: %v", err)
				continue
			}
		}

		// Upload output
		if tc.ExpectedOutputPath != "" && !utils.Contains(tc.ExpectedOutputPath, ".placeholder") {
			outputBytes := []byte(tc.ExpectedOutputPath) // Content was stored in ExpectedOutputPath during export
			outputReader := &utils.ByteReader{Data: outputBytes}
			if err := storage.UploadFile(testCasesBucket, outputKey, outputReader, int64(len(outputBytes)), "text/plain"); err != nil {
				log.Printf("[ADMIN_PROBLEM] Failed to upload output: %v", err)
				continue
			}
		}

		// Create test case record
		testCase := &models.TestCase{
			ID:                 testCaseID,
			ProblemID:          newProblemID,
			Name:               tc.Name,
			InputPath:          inputKey,
			ExpectedOutputPath: outputKey,
			Weight:             tc.Weight,
			IsSample:           tc.IsSample,
		}
		if err := repository.CreateTestCase(testCase); err != nil {
			log.Printf("[ADMIN_PROBLEM] Failed to create test case: %v", err)
			continue
		}
	}

	// Add tags
	for _, tagName := range export.Tags {
		if err := repository.AddTagToProblem(newProblemID, tagName); err != nil {
			log.Printf("[ADMIN_PROBLEM] Failed to add tag %s: %v", tagName, err)
			// Continue with other tags
		}
	}

	log.Printf("[ADMIN_PROBLEM] Imported problem %s by admin %s", newProblemID, userCtxVal.ID)
	c.JSON(http.StatusCreated, gin.H{
		"message": "Problem imported successfully",
		"id":      newProblemID,
	})
}
