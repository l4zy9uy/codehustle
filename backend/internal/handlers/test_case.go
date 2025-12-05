package handlers

import (
	"archive/zip"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"codehustle/backend/internal/constants"
	"codehustle/backend/internal/middleware"
	"codehustle/backend/internal/models"
	"codehustle/backend/internal/repository"
	"codehustle/backend/internal/storage"
)

// BulkUploadTestCasesRequest represents the request for bulk test case upload
type BulkUploadTestCasesRequest struct {
	Files []*multipart.FileHeader `form:"files[]" binding:"required"`
}

// ProcessedTestCaseInfo represents information about a processed test case
type ProcessedTestCaseInfo struct {
	Name               string `json:"name"`
	InputPath          string `json:"input_path"`
	ExpectedOutputPath string `json:"expected_output_path"`
	Weight             int    `json:"weight"`
	IsSample           bool   `json:"is_sample"`
}

// BulkUploadTestCasesResponse represents the response for bulk upload
type BulkUploadTestCasesResponse struct {
	ProblemID  string                  `json:"problem_id"`
	TestCases  []ProcessedTestCaseInfo `json:"test_cases"`
	TotalCount int                     `json:"total_count"`
	Success    bool                    `json:"success"`
}

// naturalSortKey provides natural sorting for test case file names (e.g., "1.in", "2.in", "10.in")
func naturalSortKey(name string) string {
	// Simple implementation: pad numbers with zeros
	// For better natural sorting, you might want to use a library
	return name
}

// filterTestCaseFiles filters and sorts test case files from a ZIP archive
// Returns pairs of (input, output) filenames for standard IO, or just input filenames for SPJ
func filterTestCaseFiles(nameList []string, spj bool) []string {
	var ret []string
	prefix := 1

	if spj {
		// For SPJ, only need .in files
		for {
			inName := fmt.Sprintf("%d.in", prefix)
			found := false
			for _, name := range nameList {
				if name == inName {
					ret = append(ret, inName)
					found = true
					break
				}
			}
			if !found {
				break
			}
			prefix++
		}
	} else {
		// For standard IO, need pairs of .in and .out files
		for {
			inName := fmt.Sprintf("%d.in", prefix)
			outName := fmt.Sprintf("%d.out", prefix)
			inFound := false
			outFound := false

			for _, name := range nameList {
				if name == inName {
					inFound = true
				}
				if name == outName {
					outFound = true
				}
			}

			if inFound && outFound {
				ret = append(ret, inName, outName)
				prefix++
			} else {
				break
			}
		}
	}

	// Sort the results
	sort.Slice(ret, func(i, j int) bool {
		return naturalSortKey(ret[i]) < naturalSortKey(ret[j])
	})

	return ret
}

// processZipFile processes a ZIP file containing test cases
// Returns test case info and temporary directory path (caller should clean up)
func processZipFile(zipFile *multipart.FileHeader, problemID string, spj bool) ([]ProcessedTestCaseInfo, string, error) {
	// Open the uploaded file
	file, err := zipFile.Open()
	if err != nil {
		return nil, "", fmt.Errorf("failed to open zip file: %w", err)
	}
	defer file.Close()

	// Read the entire file into memory (or use a temp file for large files)
	tempDir := filepath.Join(os.TempDir(), fmt.Sprintf("testcase_%s_%s", problemID, uuid.New().String()[:8]))
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return nil, "", fmt.Errorf("failed to create temp directory: %w", err)
	}

	tempZipPath := filepath.Join(tempDir, zipFile.Filename)
	tempZipFile, err := os.Create(tempZipPath)
	if err != nil {
		os.RemoveAll(tempDir)
		return nil, "", fmt.Errorf("failed to create temp zip file: %w", err)
	}

	_, err = io.Copy(tempZipFile, file)
	tempZipFile.Close()
	if err != nil {
		os.RemoveAll(tempDir)
		return nil, "", fmt.Errorf("failed to write temp zip file: %w", err)
	}

	// Open the ZIP archive
	zipReader, err := zip.OpenReader(tempZipPath)
	if err != nil {
		os.RemoveAll(tempDir)
		return nil, "", fmt.Errorf("invalid zip file: %w", err)
	}
	defer zipReader.Close()

	// Collect file names from ZIP
	var nameList []string
	for _, f := range zipReader.File {
		// Skip directories and info files
		if f.FileInfo().IsDir() || f.Name == "info" {
			continue
		}
		nameList = append(nameList, f.Name)
	}

	if len(nameList) == 0 {
		os.RemoveAll(tempDir)
		return nil, "", fmt.Errorf("empty zip file: no test case files found")
	}

	// Filter and sort test case files
	testCaseFiles := filterTestCaseFiles(nameList, spj)
	if len(testCaseFiles) == 0 {
		os.RemoveAll(tempDir)
		return nil, "", fmt.Errorf("no valid test case files found in zip")
	}

	// Extract files to temp directory
	for _, fileName := range testCaseFiles {
		// Find the file in the ZIP
		var zipFile *zip.File
		for _, f := range zipReader.File {
			if f.Name == fileName {
				zipFile = f
				break
			}
		}
		if zipFile == nil {
			continue
		}

		// Open file from ZIP
		rc, err := zipFile.Open()
		if err != nil {
			continue
		}

		// Create destination file
		dstPath := filepath.Join(tempDir, fileName)
		dstFile, err := os.Create(dstPath)
		if err != nil {
			rc.Close()
			continue
		}

		// Copy content, replacing \r\n with \n (like QDUOJ)
		content, err := io.ReadAll(rc)
		rc.Close()
		if err != nil {
			dstFile.Close()
			continue
		}

		content = []byte(strings.ReplaceAll(string(content), "\r\n", "\n"))
		_, err = dstFile.Write(content)
		dstFile.Close()
		if err != nil {
			continue
		}
	}

	// Process test cases
	var testCases []ProcessedTestCaseInfo
	if spj {
		// SPJ: only input files
		for i, fileName := range testCaseFiles {
			if strings.HasSuffix(fileName, ".in") {
				testCases = append(testCases, ProcessedTestCaseInfo{
					Name:      fmt.Sprintf("test_%d", i+1),
					InputPath: filepath.Join(tempDir, fileName),
					Weight:    1,
					IsSample:  false,
				})
			}
		}
	} else {
		// Standard IO: pairs of .in and .out files
		for i := 0; i < len(testCaseFiles); i += 2 {
			if i+1 >= len(testCaseFiles) {
				break
			}
			inFile := testCaseFiles[i]
			outFile := testCaseFiles[i+1]

			if strings.HasSuffix(inFile, ".in") && strings.HasSuffix(outFile, ".out") {
				testCases = append(testCases, ProcessedTestCaseInfo{
					Name:               fmt.Sprintf("test_%d", len(testCases)+1),
					InputPath:          filepath.Join(tempDir, inFile),
					ExpectedOutputPath: filepath.Join(tempDir, outFile),
					Weight:             1,
					IsSample:           false,
				})
			}
		}
	}

	return testCases, tempDir, nil
}

// BulkUploadTestCases handles bulk upload of test cases for a problem
func BulkUploadTestCases(c *gin.Context) {
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

	// Check authorization: must be instructor or admin
	if !constants.HasAnyRole(userCtxVal.Roles, constants.InstructorRoles) {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient_permissions"})
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

	// Check authorization: user must be admin or the creator
	isAdmin := constants.HasAnyRole(userCtxVal.Roles, constants.AdminRoles)
	isOwner := problem.CreatedBy == userCtxVal.ID

	if !isAdmin && !isOwner {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "insufficient_permissions",
			"message": "You can only upload test cases for problems you created unless you are an admin",
		})
		return
	}

	// Parse multipart form data
	var req BulkUploadTestCasesRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": err.Error(),
		})
		return
	}

	if len(req.Files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "missing_files",
			"message": "At least one file is required",
		})
		return
	}

	// Check if problem uses SPJ (special judge)
	// For now, assume false (standard IO). This can be enhanced later to check ProblemJudge model
	spj := false

	// Process each ZIP file
	var allTestCases []models.TestCase
	var tempDirs []string // Track temp directories for cleanup

	for _, zipFile := range req.Files {
		// Validate file size (max 50MB per file)
		if zipFile.Size > 50*1024*1024 {
			log.Printf("[TEST_CASE] File %s exceeds maximum size of 50MB", zipFile.Filename)
			continue
		}

		// Process ZIP file
		testCaseInfos, tempDir, err := processZipFile(zipFile, problemID, spj)
		if err != nil {
			log.Printf("[TEST_CASE] Failed to process zip file %s: %v", zipFile.Filename, err)
			continue
		}
		tempDirs = append(tempDirs, tempDir)

		// Upload test case files to MinIO and create database records
		bucketName := storage.GetTestCasesBucket()
		for _, tcInfo := range testCaseInfos {
			testCaseID := uuid.NewString()

			// Generate MinIO object keys
			inputKey := fmt.Sprintf("problems/%s/test_cases/%s/%s", problemID, testCaseID, filepath.Base(tcInfo.InputPath))
			var outputKey string
			if spj {
				// For SPJ, ExpectedOutputPath is not used but required by DB schema
				// Set a placeholder value
				outputKey = fmt.Sprintf("problems/%s/test_cases/%s/.spj_placeholder", problemID, testCaseID)
			} else if tcInfo.ExpectedOutputPath != "" {
				outputKey = fmt.Sprintf("problems/%s/test_cases/%s/%s", problemID, testCaseID, filepath.Base(tcInfo.ExpectedOutputPath))
			} else {
				// Fallback: set placeholder if output path is missing
				outputKey = fmt.Sprintf("problems/%s/test_cases/%s/.placeholder", problemID, testCaseID)
			}

			// Upload input file to MinIO
			inputFile, err := os.Open(tcInfo.InputPath)
			if err != nil {
				log.Printf("[TEST_CASE] Failed to open input file %s: %v", tcInfo.InputPath, err)
				continue
			}

			stat, _ := inputFile.Stat()
			if err := storage.UploadFile(bucketName, inputKey, inputFile, stat.Size(), "application/octet-stream"); err != nil {
				inputFile.Close()
				log.Printf("[TEST_CASE] Failed to upload input file: %v", err)
				continue
			}
			inputFile.Close()

			// Upload output file to MinIO (if not SPJ)
			if !spj && outputKey != "" {
				outputFile, err := os.Open(tcInfo.ExpectedOutputPath)
				if err != nil {
					log.Printf("[TEST_CASE] Failed to open output file %s: %v", tcInfo.ExpectedOutputPath, err)
					continue
				}

				stat, _ := outputFile.Stat()
				if err := storage.UploadFile(bucketName, outputKey, outputFile, stat.Size(), "application/octet-stream"); err != nil {
					outputFile.Close()
					log.Printf("[TEST_CASE] Failed to upload output file: %v", err)
					continue
				}
				outputFile.Close()
			}

			// Create test case record
			testCase := models.TestCase{
				ID:                 testCaseID,
				ProblemID:          problemID,
				Name:               tcInfo.Name,
				InputPath:          inputKey,
				ExpectedOutputPath: outputKey,
				Weight:             tcInfo.Weight,
				IsSample:           tcInfo.IsSample,
			}

			allTestCases = append(allTestCases, testCase)
		}
	}

	// Clean up temporary directories
	for _, tempDir := range tempDirs {
		os.RemoveAll(tempDir)
	}

	// Create test cases in database
	if len(allTestCases) > 0 {
		if err := repository.CreateTestCasesBatch(allTestCases); err != nil {
			log.Printf("[TEST_CASE] Failed to create test cases in database: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "failed_to_create_test_cases",
				"message": err.Error(),
			})
			return
		}
	}

	// Build response
	var responseTestCases []ProcessedTestCaseInfo
	for _, tc := range allTestCases {
		responseTestCases = append(responseTestCases, ProcessedTestCaseInfo{
			Name:               tc.Name,
			InputPath:          tc.InputPath,
			ExpectedOutputPath: tc.ExpectedOutputPath,
			Weight:             tc.Weight,
			IsSample:           tc.IsSample,
		})
	}

	response := BulkUploadTestCasesResponse{
		ProblemID:  problemID,
		TestCases:  responseTestCases,
		TotalCount: len(responseTestCases),
		Success:    true,
	}

	log.Printf("[TEST_CASE] Bulk upload completed for problem %s: %d test cases uploaded by user %s", problemID, len(responseTestCases), userCtxVal.ID)
	c.JSON(http.StatusOK, response)
}

// DeleteTestCasesRequest represents the request for deleting test cases
type DeleteTestCasesRequest struct {
	TestCaseIDs []string `json:"test_case_ids" binding:"required"`
}

// DeleteTestCasesResponse represents the response for delete operation
type DeleteTestCasesResponse struct {
	ProblemID  string   `json:"problem_id"`
	DeletedIDs []string `json:"deleted_ids"`
	TotalCount int      `json:"total_count"`
	Success    bool     `json:"success"`
}

// DeleteTestCases handles deletion of test cases for a problem
func DeleteTestCases(c *gin.Context) {
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

	// Check authorization: must be instructor or admin
	if !constants.HasAnyRole(userCtxVal.Roles, constants.InstructorRoles) {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient_permissions"})
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

	// Check authorization: user must be admin or the creator
	isAdmin := constants.HasAnyRole(userCtxVal.Roles, constants.AdminRoles)
	isOwner := problem.CreatedBy == userCtxVal.ID

	if !isAdmin && !isOwner {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "insufficient_permissions",
			"message": "You can only delete test cases for problems you created unless you are an admin",
		})
		return
	}

	// Check if deleting single test case (from URL param) or bulk (from body)
	testCaseID := c.Param("test_case_id")
	var testCaseIDs []string

	if testCaseID != "" {
		// Single test case deletion via URL parameter
		testCaseIDs = []string{testCaseID}
	} else {
		// Bulk deletion via request body
		var req DeleteTestCasesRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "invalid_request",
				"message": err.Error(),
			})
			return
		}

		if len(req.TestCaseIDs) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "missing_test_case_ids",
				"message": "At least one test case ID is required",
			})
			return
		}

		testCaseIDs = req.TestCaseIDs
	}

	// Verify all test cases exist and belong to the problem
	var validTestCaseIDs []string
	bucketName := storage.GetTestCasesBucket()

	for _, id := range testCaseIDs {
		testCase, err := repository.GetTestCaseByID(id)
		if err != nil {
			log.Printf("[TEST_CASE] Test case %s not found: %v", id, err)
			continue
		}

		// Verify test case belongs to the problem
		if testCase.ProblemID != problemID {
			log.Printf("[TEST_CASE] Test case %s does not belong to problem %s", id, problemID)
			continue
		}

		validTestCaseIDs = append(validTestCaseIDs, id)

		// Delete files from MinIO
		if testCase.InputPath != "" {
			if err := storage.DeleteFile(bucketName, testCase.InputPath); err != nil {
				log.Printf("[TEST_CASE] Failed to delete input file %s from MinIO: %v", testCase.InputPath, err)
				// Continue with deletion even if MinIO delete fails
			}
		}

		if testCase.ExpectedOutputPath != "" && !strings.Contains(testCase.ExpectedOutputPath, ".placeholder") {
			if err := storage.DeleteFile(bucketName, testCase.ExpectedOutputPath); err != nil {
				log.Printf("[TEST_CASE] Failed to delete output file %s from MinIO: %v", testCase.ExpectedOutputPath, err)
				// Continue with deletion even if MinIO delete fails
			}
		}
	}

	if len(validTestCaseIDs) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "no_valid_test_cases",
			"message": "No valid test cases found to delete",
		})
		return
	}

	// Delete test cases from database
	if err := repository.DeleteTestCasesBatch(validTestCaseIDs); err != nil {
		log.Printf("[TEST_CASE] Failed to delete test cases from database: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_delete_test_cases",
			"message": err.Error(),
		})
		return
	}

	response := DeleteTestCasesResponse{
		ProblemID:  problemID,
		DeletedIDs: validTestCaseIDs,
		TotalCount: len(validTestCaseIDs),
		Success:    true,
	}

	log.Printf("[TEST_CASE] Deleted %d test cases for problem %s by user %s", len(validTestCaseIDs), problemID, userCtxVal.ID)
	c.JSON(http.StatusOK, response)
}

// DownloadTestCases downloads all test cases for a problem as a ZIP file (Admin only)
func DownloadTestCases(c *gin.Context) {
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

	// Check authorization: must be admin
	if !constants.HasAnyRole(userCtxVal.Roles, constants.AdminRoles) {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient_permissions"})
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

	// Get all test cases for the problem
	testCases, err := repository.GetTestCasesByProblemID(problemID)
	if err != nil {
		log.Printf("[TEST_CASE] Failed to get test cases: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_fetch_test_cases",
			"message": err.Error(),
		})
		return
	}

	if len(testCases) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "no_test_cases",
			"message": "No test cases found for this problem",
		})
		return
	}

	// Check if problem uses SPJ
	judge, err := repository.GetProblemJudgeByProblemID(problemID)
	spj := false
	if err == nil && judge != nil {
		spj = judge.CheckerKind == "SPJ" || judge.CheckerKind == "spj"
	}

	bucketName := storage.GetTestCasesBucket()

	// Create ZIP file in memory
	c.Header("Content-Type", "application/zip")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=test_cases_%s.zip", problemID))
	c.Header("Content-Transfer-Encoding", "binary")

	zipWriter := zip.NewWriter(c.Writer)
	defer zipWriter.Close()

	// Add test cases to ZIP
	testCaseNum := 1
	for _, tc := range testCases {
		// Download input file from MinIO
		if tc.InputPath != "" {
			inputContent, err := storage.GetFile(bucketName, tc.InputPath)
			if err != nil {
				log.Printf("[TEST_CASE] Failed to download input file %s: %v", tc.InputPath, err)
				continue
			}

			// Create file in ZIP
			inFileName := fmt.Sprintf("%d.in", testCaseNum)
			inFile, err := zipWriter.Create(inFileName)
			if err != nil {
				log.Printf("[TEST_CASE] Failed to create file in ZIP: %v", err)
				continue
			}

			// Write content (normalize line endings)
			content := strings.ReplaceAll(string(inputContent), "\r\n", "\n")
			if _, err := inFile.Write([]byte(content)); err != nil {
				log.Printf("[TEST_CASE] Failed to write input file to ZIP: %v", err)
				continue
			}
		}

		// Download output file from MinIO (if not SPJ)
		if !spj && tc.ExpectedOutputPath != "" && !strings.Contains(tc.ExpectedOutputPath, ".placeholder") {
			outputContent, err := storage.GetFile(bucketName, tc.ExpectedOutputPath)
			if err != nil {
				log.Printf("[TEST_CASE] Failed to download output file %s: %v", tc.ExpectedOutputPath, err)
				continue
			}

			// Create file in ZIP
			outFileName := fmt.Sprintf("%d.out", testCaseNum)
			outFile, err := zipWriter.Create(outFileName)
			if err != nil {
				log.Printf("[TEST_CASE] Failed to create file in ZIP: %v", err)
				continue
			}

			// Write content (normalize line endings)
			content := strings.ReplaceAll(string(outputContent), "\r\n", "\n")
			if _, err := outFile.Write([]byte(content)); err != nil {
				log.Printf("[TEST_CASE] Failed to write output file to ZIP: %v", err)
				continue
			}
		}

		testCaseNum++
	}

	log.Printf("[TEST_CASE] Downloaded test cases for problem %s by admin %s", problemID, userCtxVal.ID)
}
