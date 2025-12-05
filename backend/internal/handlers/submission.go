package handlers

import (
	"context"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"codehustle/backend/internal/constants"
	"codehustle/backend/internal/middleware"
	"codehustle/backend/internal/models"
	"codehustle/backend/internal/queue"
	"codehustle/backend/internal/repository"
	"codehustle/backend/internal/storage"
)

// SubmitProblemRequest represents the expected payload for submitting a problem solution
type SubmitProblemRequest struct {
	CodeFile        *multipart.FileHeader `form:"code_file" binding:"required"`
	Language        string                `form:"language" binding:"required"`
	LanguageVersion string                `form:"language_version"`
	CourseID        string                `form:"course_id"`
	ContestID       string                `form:"contest_id"`
}

// SubmitProblemResponse represents the response after submitting
type SubmitProblemResponse struct {
	ID          string `json:"id"`
	ProblemID   string `json:"problem_id"`
	Status      string `json:"status"`
	SubmittedAt string `json:"submitted_at"`
	Message     string `json:"message"`
}

// SubmitProblem handles code submission for a problem
func SubmitProblem(c *gin.Context) {
	identifier := c.Param("id")
	log.Printf("[SUBMIT] SubmitProblem called with identifier: %s", identifier)

	if identifier == "" {
		log.Printf("[SUBMIT] Error: missing problem identifier")
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_problem_identifier"})
		return
	}

	// Get user context
	userCtx, exists := c.Get("user")
	if !exists {
		log.Printf("[SUBMIT] Error: missing user context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing_user_context"})
		return
	}

	userCtxVal, ok := userCtx.(middleware.UserContext)
	if !ok {
		log.Printf("[SUBMIT] Error: invalid user context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_user_context"})
		return
	}
	log.Printf("[SUBMIT] User: %s (roles: %v)", userCtxVal.ID, userCtxVal.Roles)

	// Get problem
	problem, err := repository.GetProblem(identifier)
	if err != nil {
		log.Printf("[SUBMIT] Error: problem not found: %v", err)
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "problem_not_found",
			"message": err.Error(),
		})
		return
	}
	log.Printf("[SUBMIT] Problem found: ID=%s, Slug=%s, IsPublic=%v", problem.ID, problem.Slug, problem.IsPublic)

	// Check if user can access this problem (basic check - can be enhanced)
	// For now, allow if problem is public or user is admin/instructor
	if !problem.IsPublic {
		if !constants.HasAnyRole(userCtxVal.Roles, constants.PrivilegedRoles) {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "insufficient_permissions",
				"message": "You do not have access to this problem",
			})
			return
		}
	}

	// Parse multipart form data
	var req SubmitProblemRequest
	if err := c.ShouldBind(&req); err != nil {
		log.Printf("[SUBMIT] Error: failed to bind request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": err.Error(),
		})
		return
	}
	log.Printf("[SUBMIT] Request parsed: language=%s, language_version=%s, course_id=%s, contest_id=%s, file_size=%d",
		req.Language, req.LanguageVersion, req.CourseID, req.ContestID, req.CodeFile.Size)

	// Validate file size (max 1MB)
	if req.CodeFile.Size > 1024*1024 {
		log.Printf("[SUBMIT] Error: file too large: %d bytes", req.CodeFile.Size)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "file_too_large",
			"message": "Code file exceeds maximum size of 1MB",
		})
		return
	}

	// Read code file content
	file, err := req.CodeFile.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_open_file",
			"message": err.Error(),
		})
		return
	}
	defer file.Close()

	codeBytes, err := io.ReadAll(file)
	if err != nil {
		log.Printf("[SUBMIT] Error: failed to read file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_read_file",
			"message": err.Error(),
		})
		return
	}
	codeContent := string(codeBytes)
	log.Printf("[SUBMIT] Code file read: %d bytes, first 100 chars: %s", len(codeBytes),
		func() string {
			if len(codeContent) > 100 {
				return codeContent[:100] + "..."
			}
			return codeContent
		}())

	// Validate language (basic validation)
	supportedLanguages := []string{"cpp", "python", "java", "javascript", "go", "rust"}
	languageValid := false
	for _, lang := range supportedLanguages {
		if strings.ToLower(req.Language) == lang {
			languageValid = true
			break
		}
	}
	if !languageValid {
		log.Printf("[SUBMIT] Error: unsupported language: %s", req.Language)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "unsupported_language",
			"message": "Language not supported",
		})
		return
	}
	log.Printf("[SUBMIT] Language validated: %s", req.Language)

	// Create submission record
	submissionID := uuid.NewString()
	codeSizeBytes := len(codeBytes)
	languageVersion := req.LanguageVersion
	if languageVersion == "" {
		languageVersion = "latest" // Default version
	}

	submission := models.Submission{
		ID:              submissionID,
		ProblemID:       problem.ID,
		UserID:          userCtxVal.ID,
		Code:            codeContent,
		Language:        strings.ToLower(req.Language),
		LanguageVersion: &languageVersion,
		Status:          "pending",
		CodeSizeBytes:   &codeSizeBytes,
	}

	// Set optional fields
	if req.CourseID != "" {
		submission.CourseID = &req.CourseID
	}
	if req.ContestID != "" {
		submission.ContestID = &req.ContestID
	}

	// Save submission to database
	log.Printf("[SUBMIT] Creating submission record: ID=%s, ProblemID=%s, UserID=%s, Language=%s, CodeSize=%d",
		submissionID, problem.ID, userCtxVal.ID, submission.Language, codeSizeBytes)
	if err := repository.CreateSubmission(&submission); err != nil {
		log.Printf("[SUBMIT] Error: failed to create submission: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_create_submission",
			"message": err.Error(),
		})
		return
	}
	log.Printf("[SUBMIT] Submission record created successfully: %s", submissionID)

	// Enqueue judge job to Redis Stream
	ctx := context.Background()
	judgeJob := &queue.JudgeJob{
		SubmissionID:    submissionID,
		ProblemID:       problem.ID,
		UserID:          userCtxVal.ID,
		Code:            codeContent,
		Language:        submission.Language,
		LanguageVersion: languageVersion,
	}

	if req.CourseID != "" {
		judgeJob.CourseID = req.CourseID
		log.Printf("[SUBMIT] CourseID set: %s", req.CourseID)
	}
	if req.ContestID != "" {
		judgeJob.ContestID = req.ContestID
		log.Printf("[SUBMIT] ContestID set: %s", req.ContestID)
	}

	log.Printf("[SUBMIT] Enqueueing judge job to Redis Stream...")
	streamID, err := queue.EnqueueJudgeJob(ctx, judgeJob)
	if err != nil {
		log.Printf("[SUBMIT] Error: failed to enqueue judge job: %v", err)
		// Still return success, but log the error
		// The submission is saved, worker can pick it up later
	} else {
		log.Printf("[SUBMIT] Judge job enqueued successfully: streamID=%s", streamID)
	}

	log.Printf("[SUBMIT] Success: Created submission %s for problem %s (%s) by user %s",
		submissionID, problem.ID, problem.Slug, userCtxVal.ID)

	c.JSON(http.StatusCreated, SubmitProblemResponse{
		ID:          submissionID,
		ProblemID:   problem.ID,
		Status:      "pending",
		SubmittedAt: submission.SubmittedAt.Format("2006-01-02T15:04:05Z"),
		Message:     "Submission received and queued for judging",
	})
}

// SubmissionDetailResponse represents detailed submission information
type SubmissionDetailResponse struct {
	ID              string                 `json:"id"`
	ProblemID       string                 `json:"problem_id"`
	UserID          string                 `json:"user_id"`
	Problem         ProblemInfo            `json:"problem"`
	Code            string                 `json:"code"`
	Language        string                 `json:"language"`
	LanguageVersion *string                `json:"language_version,omitempty"`
	Status          string                 `json:"status"`
	Score           *int                   `json:"score,omitempty"`
	ExecutionTime   *int                   `json:"execution_time,omitempty"`
	MemoryUsage     *int                   `json:"memory_usage,omitempty"`
	CodeSizeBytes   *int                   `json:"code_size_bytes,omitempty"`
	CompileLog      *string                `json:"compile_log,omitempty"`
	RunLog          *string                `json:"run_log,omitempty"`
	SubmittedAt     string                 `json:"submitted_at"`
	TestCaseResults []TestCaseResultDetail `json:"test_case_results"`
	Summary         *SubmissionSummary     `json:"summary,omitempty"`
}

type ProblemInfo struct {
	ID   string `json:"id"`
	Code string `json:"code"`
	Name string `json:"name"`
}

type TestCaseResultDetail struct {
	ID             uint         `json:"id"`
	TestCaseID     string       `json:"test_case_id"`
	TestCase       TestCaseInfo `json:"test_case"`
	Status         string       `json:"status"`
	Score          *int         `json:"score,omitempty"`
	TimeMs         *int         `json:"time_ms,omitempty"`
	MemoryKb       *int         `json:"memory_kb,omitempty"`
	LogPath        *string      `json:"log_path,omitempty"`
	CreatedAt      string       `json:"created_at"`
	// Test case details for wrong_answer cases
	Input          *string `json:"input,omitempty"`
	ExpectedOutput *string `json:"expected_output,omitempty"`
	UserOutput     *string `json:"user_output,omitempty"`
}

type TestCaseInfo struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	IsSample bool   `json:"is_sample"`
}

type SubmissionSummary struct {
	TotalTests  int `json:"total_tests"`
	PassedTests int `json:"passed_tests"`
	TotalScore  int `json:"total_score"`
	MaxScore    int `json:"max_score"`
}

// GetSubmission returns detailed submission information
func GetSubmission(c *gin.Context) {
	submissionID := c.Param("id")
	if submissionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_submission_id"})
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

	// Get submission
	submission, err := repository.GetSubmission(submissionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "submission_not_found",
			"message": err.Error(),
		})
		return
	}

	// Check authorization: user can only view their own submissions unless admin/instructor
	isAdmin := constants.HasAnyRole(userCtxVal.Roles, constants.PrivilegedRoles)
	if !isAdmin && submission.UserID != userCtxVal.ID {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "insufficient_permissions",
			"message": "You can only view your own submissions",
		})
		return
	}

	// Get problem info
	problem, err := repository.GetProblem(submission.ProblemID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_load_problem",
			"message": err.Error(),
		})
		return
	}

	// Build response
	response := SubmissionDetailResponse{
		ID:              submission.ID,
		ProblemID:       submission.ProblemID,
		UserID:          submission.UserID,
		Problem:         ProblemInfo{ID: problem.ID, Code: problem.Slug, Name: problem.Title},
		Code:            submission.Code,
		Language:        submission.Language,
		LanguageVersion: submission.LanguageVersion,
		Status:          submission.Status,
		Score:           submission.Score,
		ExecutionTime:   submission.ExecutionTime,
		MemoryUsage:     submission.MemoryUsage,
		CodeSizeBytes:   submission.CodeSizeBytes,
		SubmittedAt:     submission.SubmittedAt.Format("2006-01-02T15:04:05Z"),
	}

	// Add compile/run logs if available
	if submission.CompileLogPath != nil {
		response.CompileLog = submission.CompileLogPath
	}
	if submission.RunLogPath != nil {
		response.RunLog = submission.RunLogPath
	}

	// Build test case results
	response.TestCaseResults = make([]TestCaseResultDetail, len(submission.TestCaseResults))
	
	// Check if we need to fetch test case details (for wrong_answer cases)
	needTestDetails := false
	for _, tc := range submission.TestCaseResults {
		if tc.Status == "wrong_answer" {
			needTestDetails = true
			break
		}
	}

	// Fetch test case details from MinIO if needed
	bucketName := storage.GetTestCasesBucket()
	var testCaseDetails map[string]struct {
		input          string
		expectedOutput string
	}
	if needTestDetails {
		testCaseDetails = make(map[string]struct {
			input          string
			expectedOutput string
		})
		
		for _, tc := range submission.TestCaseResults {
			if tc.Status == "wrong_answer" && tc.TestCase.InputPath != "" {
				// Fetch input
				if inputBytes, err := storage.GetFile(bucketName, tc.TestCase.InputPath); err == nil {
					// Fetch expected output
					var expectedOutputBytes []byte
					if tc.TestCase.ExpectedOutputPath != "" && !strings.Contains(tc.TestCase.ExpectedOutputPath, ".placeholder") {
						if bytes, err := storage.GetFile(bucketName, tc.TestCase.ExpectedOutputPath); err == nil {
							expectedOutputBytes = bytes
						}
					}
					
					testCaseDetails[tc.TestCaseID] = struct {
						input          string
						expectedOutput string
					}{
						input:          string(inputBytes),
						expectedOutput: string(expectedOutputBytes),
					}
				}
			}
		}
	}

	for i, tc := range submission.TestCaseResults {
		testCaseInfo := TestCaseInfo{
			ID:       tc.TestCase.ID,
			Name:     tc.TestCase.Name,
			IsSample: tc.TestCase.IsSample,
		}
		
		result := TestCaseResultDetail{
			ID:         tc.ID,
			TestCaseID: tc.TestCaseID,
			TestCase:   testCaseInfo,
			Status:     tc.Status,
			Score:      tc.Score,
			TimeMs:     tc.TimeMs,
			MemoryKb:   tc.MemoryKb,
			LogPath:    tc.LogPath,
			CreatedAt:  tc.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}

		// Add test case details for wrong_answer cases
		if tc.Status == "wrong_answer" {
			if details, ok := testCaseDetails[tc.TestCaseID]; ok {
				result.Input = &details.input
				if details.expectedOutput != "" {
					result.ExpectedOutput = &details.expectedOutput
				}
			}
			
			// Fetch user output from MinIO if available
			if tc.UserOutputPath != nil && *tc.UserOutputPath != "" {
				if userOutputBytes, err := storage.GetFile(bucketName, *tc.UserOutputPath); err == nil {
					userOutput := string(userOutputBytes)
					result.UserOutput = &userOutput
				}
			}
		}

		response.TestCaseResults[i] = result
	}

	// Add summary if submission is completed
	isCompleted := submission.Status != "pending" && submission.Status != "running"
	if isCompleted && len(submission.TestCaseResults) > 0 {
		totalTests := len(submission.TestCaseResults)
		passedTests := 0
		totalScore := 0
		maxScore := 0

		for _, tc := range submission.TestCaseResults {
			if tc.Status == "accepted" {
				passedTests++
			}
			if tc.Score != nil {
				totalScore += *tc.Score
			}
			// Max score would be sum of all test case weights
			// For now, we'll use the total score if all passed
		}

		if submission.Score != nil {
			maxScore = *submission.Score // This should be the max possible score
			// In a real implementation, you'd calculate this from test case weights
		}

		response.Summary = &SubmissionSummary{
			TotalTests:  totalTests,
			PassedTests: passedTests,
			TotalScore:  totalScore,
			MaxScore:    maxScore,
		}
	}

	c.JSON(http.StatusOK, response)
}

// ListSubmissionsResponse represents paginated submission list
type ListSubmissionsResponse struct {
	Submissions []SubmissionListItem `json:"submissions"`
	Total       int64                `json:"total"`
	Page        int                  `json:"page"`
	PageSize    int                  `json:"page_size"`
}

type SubmissionListItem struct {
	ID            string      `json:"id"`
	ProblemID     string      `json:"problem_id"`
	Problem       ProblemInfo `json:"problem"`
	Language      string      `json:"language"`
	Status        string      `json:"status"`
	Score         *int        `json:"score,omitempty"`
	ExecutionTime *int        `json:"execution_time,omitempty"`
	MemoryUsage   *int        `json:"memory_usage,omitempty"`
	SubmittedAt   string      `json:"submitted_at"`
}

// ListSubmissions returns a paginated list of submissions
func ListSubmissions(c *gin.Context) {
	// Get pagination parameters
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "25")
	problemID := c.Query("problem_id")
	requestedUserID := c.Query("user_id")

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

	// Determine userID filter
	userID := ""
	isPrivileged := constants.HasAnyRole(userCtxVal.Roles, constants.PrivilegedRoles)

	if isPrivileged {
		// Admin/instructor: can use user_id query parameter if provided, otherwise show all
		if requestedUserID != "" {
			userID = requestedUserID
		}
		// If requestedUserID is empty, userID stays empty (shows all users)
	} else {
		// Regular users: always filter by their own ID (ignore user_id parameter for security)
		userID = userCtxVal.ID
	}

	// Get submissions
	submissions, total, err := repository.ListSubmissions(userID, problemID, pageNum, pageSizeNum)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_fetch_submissions",
			"message": err.Error(),
		})
		return
	}

	// Build response
	items := make([]SubmissionListItem, len(submissions))
	for i, sub := range submissions {
		// Load problem info
		problem, err := repository.GetProblem(sub.ProblemID)
		if err != nil {
			// If problem not found, use minimal info
			items[i] = SubmissionListItem{
				ID:            sub.ID,
				ProblemID:     sub.ProblemID,
				Problem:       ProblemInfo{ID: sub.ProblemID, Code: "", Name: "Unknown Problem"},
				Language:      sub.Language,
				Status:        sub.Status,
				Score:         sub.Score,
				ExecutionTime: sub.ExecutionTime,
				MemoryUsage:   sub.MemoryUsage,
				SubmittedAt:   sub.SubmittedAt.Format("2006-01-02T15:04:05Z"),
			}
			continue
		}

		items[i] = SubmissionListItem{
			ID:            sub.ID,
			ProblemID:     sub.ProblemID,
			Problem:       ProblemInfo{ID: problem.ID, Code: problem.Slug, Name: problem.Title},
			Language:      sub.Language,
			Status:        sub.Status,
			Score:         sub.Score,
			ExecutionTime: sub.ExecutionTime,
			MemoryUsage:   sub.MemoryUsage,
			SubmittedAt:   sub.SubmittedAt.Format("2006-01-02T15:04:05Z"),
		}
	}

	c.JSON(http.StatusOK, ListSubmissionsResponse{
		Submissions: items,
		Total:       total,
		Page:        pageNum,
		PageSize:    pageSizeNum,
	})
}

// GetProblemSubmissions returns submissions for a specific problem
func GetProblemSubmissions(c *gin.Context) {
	problemID := c.Param("id")
	if problemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_problem_id"})
		return
	}

	// Get pagination parameters
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "25")
	requestedUserID := c.Query("user_id")

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
	_, err = repository.GetProblem(problemID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "problem_not_found",
			"message": err.Error(),
		})
		return
	}

	// Determine userID filter
	userID := ""
	isPrivileged := constants.HasAnyRole(userCtxVal.Roles, constants.PrivilegedRoles)

	if isPrivileged {
		// Admin/instructor: can use user_id query parameter if provided, otherwise show all
		if requestedUserID != "" {
			userID = requestedUserID
		}
		// If requestedUserID is empty, userID stays empty (shows all users)
	} else {
		// Regular users: always filter by their own ID (ignore user_id parameter for security)
		userID = userCtxVal.ID
	}

	// Get submissions for this problem
	submissions, total, err := repository.ListSubmissions(userID, problemID, pageNum, pageSizeNum)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_fetch_submissions",
			"message": err.Error(),
		})
		return
	}

	// Build response
	items := make([]SubmissionListItem, len(submissions))
	for i, sub := range submissions {
		// Load problem info
		problem, err := repository.GetProblem(sub.ProblemID)
		if err != nil {
			// If problem not found, use minimal info
			items[i] = SubmissionListItem{
				ID:            sub.ID,
				ProblemID:     sub.ProblemID,
				Problem:       ProblemInfo{ID: sub.ProblemID, Code: "", Name: "Unknown Problem"},
				Language:      sub.Language,
				Status:        sub.Status,
				Score:         sub.Score,
				ExecutionTime: sub.ExecutionTime,
				MemoryUsage:   sub.MemoryUsage,
				SubmittedAt:   sub.SubmittedAt.Format("2006-01-02T15:04:05Z"),
			}
			continue
		}

		items[i] = SubmissionListItem{
			ID:            sub.ID,
			ProblemID:     sub.ProblemID,
			Problem:       ProblemInfo{ID: problem.ID, Code: problem.Slug, Name: problem.Title},
			Language:      sub.Language,
			Status:        sub.Status,
			Score:         sub.Score,
			ExecutionTime: sub.ExecutionTime,
			MemoryUsage:   sub.MemoryUsage,
			SubmittedAt:   sub.SubmittedAt.Format("2006-01-02T15:04:05Z"),
		}
	}

	c.JSON(http.StatusOK, ListSubmissionsResponse{
		Submissions: items,
		Total:       total,
		Page:        pageNum,
		PageSize:    pageSizeNum,
	})
}
