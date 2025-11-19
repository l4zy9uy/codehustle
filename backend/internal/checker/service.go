package checker

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"codehustle/backend/internal/config"
	"codehustle/backend/internal/pistonlog"
	"codehustle/backend/internal/storage"

	"github.com/sirupsen/logrus"

	"github.com/minio/minio-go/v7"
)

// Service handles checker compilation and execution via Piston
type Service struct {
	minioClient *minio.Client
	pistonURL   string
	bucket      string
}

// CheckRequest represents a checker execution request
type CheckRequest struct {
	CheckerPath   string
	Input         string
	Output        string
	Expected      string
	RuntimeImage  string
	Version       string
	StatementPath string // Used to derive checker path if checker_custom_path fails
}

// CheckResponse represents the result of checker execution
type CheckResponse struct {
	Accepted      bool
	Error         string
	CompileStderr string
	RunStderr     string
}

// NewService creates a new checker service instance
func NewService(minioClient *minio.Client) *Service {
	bucket := config.Get("BUCKET_PROBLEM_CHECKERS")
	if bucket == "" {
		bucket = "problem-checkers"
	}

	pistonURL := config.Get("PISTON_URL")
	if pistonURL == "" {
		pistonURL = "http://127.0.0.1:3002"
	}

	return &Service{
		minioClient: minioClient,
		pistonURL:   pistonURL,
		bucket:      bucket,
	}
}

// Check compiles and executes a checker using Piston
func (s *Service) Check(req CheckRequest) (*CheckResponse, error) {
	// Try to download checker.cpp from MinIO
	// First try the stored checker_custom_path, then derive from statement_path if it fails
	checkerPath := req.CheckerPath

	logrus.WithFields(logrus.Fields{
		"bucket":         s.bucket,
		"checker_path":   checkerPath,
		"statement_path": req.StatementPath,
	}).Info("Attempting to fetch checker")

	checkerBytes, err := storage.GetFile(s.bucket, checkerPath)
	var derivedPath string

	// If checker not found and we have statement path, try deriving checker path from statement path
	if err != nil && req.StatementPath != "" {
		// Derive checker path from statement path
		// e.g., "big_integer/addition_of_big_integers/statement.en.md" -> "big_integer/addition_of_big_integers/checker.cpp"
		derivedPath = deriveCheckerPathFromStatement(req.StatementPath)
		logrus.WithFields(logrus.Fields{
			"original_path":  checkerPath,
			"statement_path": req.StatementPath,
			"derived_path":   derivedPath,
			"error":          err,
		}).Info("Original checker path not found, trying derived path from statement")

		checkerBytes, err = storage.GetFile(s.bucket, derivedPath)
		if err == nil {
			checkerPath = derivedPath
			logrus.WithFields(logrus.Fields{
				"derived_path": derivedPath,
			}).Info("Successfully found checker using derived path")
		} else {
			logrus.WithFields(logrus.Fields{
				"derived_path": derivedPath,
				"error":        err,
			}).Error("Derived path also failed")
		}
	}

	if err != nil {
		errorMsg := fmt.Sprintf("failed to fetch checker from bucket '%s' at path '%s'", s.bucket, checkerPath)
		if derivedPath != "" {
			errorMsg += fmt.Sprintf(" (also tried derived path '%s')", derivedPath)
		}
		errorMsg += fmt.Sprintf(": %v", err)

		return &CheckResponse{
			Accepted: false,
			Error:    errorMsg,
		}, nil
	}

	// Try to download testlib.h from MinIO (judge-common bucket)
	var testlibBytes []byte
	testlibBucket := config.Get("BUCKET_JUDGE_COMMON")
	if testlibBucket == "" {
		testlibBucket = "judge-common" // Default bucket name
	}

	testlibPath := "common/testlib.h"
	testlibBytes, err = storage.GetFile(testlibBucket, testlibPath)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"bucket": testlibBucket,
			"path":   testlibPath,
			"error":  err,
		}).Debug("testlib.h not found in MinIO, continuing without it")
		// Reset err to nil so we can continue without testlib.h
		err = nil
	} else {
		logrus.WithFields(logrus.Fields{
			"bucket": testlibBucket,
			"path":   testlibPath,
		}).Debug("Found testlib.h")
	}

	// Generate combined source file that includes checker and wrapper
	combinedCode := s.generateCombinedCode(string(checkerBytes), req.Input, req.Output, req.Expected, testlibBytes)

	// Prepare files for Piston - use main.cpp as single entry point
	files := []map[string]string{
		{"name": "main.cpp", "content": combinedCode},
	}

	// Determine Piston language and version
	language := "cpp"
	pistonVersion := s.mapVersionToPiston(req.Version, req.RuntimeImage)

	// Prepare Piston payload
	payload := map[string]interface{}{
		"language":        language,
		"version":         pistonVersion,
		"files":           files,
		"stdin":           "",
		"args":            []string{},
		"compile_timeout": 10000,
		"run_timeout":     5000,              // 5 second timeout for checker
		"memory_limit":    256 * 1024 * 1024, // 256MB
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return &CheckResponse{
			Accepted: false,
			Error:    fmt.Sprintf("failed to marshal payload: %v", err),
		}, nil
	}

	// Call Piston API
	execURL := s.pistonURL + "/api/v2/execute"
	logrus.WithFields(logrus.Fields{
		"checker_path": req.CheckerPath,
		"piston_url":   execURL,
		"language":     language,
		"version":      pistonVersion,
	}).Debug("Calling Piston to compile and run checker")

	// Log request to file
	pistonlog.LogRequest(execURL, payload, map[string]interface{}{
		"checker_path": req.CheckerPath,
		"type":         "checker",
	})

	httpReq, err := http.NewRequest(http.MethodPost, execURL, strings.NewReader(string(body)))
	if err != nil {
		return &CheckResponse{
			Accepted: false,
			Error:    fmt.Sprintf("failed to create request: %v", err),
		}, nil
	}
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		pistonlog.LogError(execURL, err, map[string]interface{}{
			"checker_path": req.CheckerPath,
			"type":         "checker",
		})
		return &CheckResponse{
			Accepted: false,
			Error:    fmt.Sprintf("piston execution error: %v", err),
		}, nil
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return &CheckResponse{
			Accepted: false,
			Error:    fmt.Sprintf("failed to read response: %v", err),
		}, nil
	}

	// Log response to file
	pistonlog.LogResponse(execURL, resp.StatusCode, respBody, map[string]interface{}{
		"checker_path": req.CheckerPath,
		"type":         "checker",
	})

	// Parse Piston response
	var pistonResult struct {
		Compile struct {
			Code   int    `json:"code"`
			Stdout string `json:"stdout"`
			Stderr string `json:"stderr"`
		} `json:"compile"`
		Run struct {
			Code   int    `json:"code"`
			Stdout string `json:"stdout"`
			Stderr string `json:"stderr"`
		} `json:"run"`
	}

	if err := json.Unmarshal(respBody, &pistonResult); err != nil {
		logrus.WithField("response_body", string(respBody)).Error("Failed to parse Piston response")
		return &CheckResponse{
			Accepted: false,
			Error:    fmt.Sprintf("failed to parse response: %v", err),
		}, nil
	}

	// Check compilation errors
	if pistonResult.Compile.Code != 0 {
		return &CheckResponse{
			Accepted:      false,
			Error:         fmt.Sprintf("compilation failed with exit code %d", pistonResult.Compile.Code),
			CompileStderr: pistonResult.Compile.Stderr,
		}, nil
	}

	// Check runtime errors
	if pistonResult.Run.Code != 0 && pistonResult.Run.Code != 1 {
		// Exit code 1 might be acceptable (wrong answer), but other codes indicate errors
		return &CheckResponse{
			Accepted:  false,
			Error:     fmt.Sprintf("checker execution failed with exit code %d", pistonResult.Run.Code),
			RunStderr: pistonResult.Run.Stderr,
		}, nil
	}

	// Checker returns 0 for accepted, non-zero (usually 1) for wrong answer
	// Exit code 0 = accepted, non-zero = wrong answer
	accepted := pistonResult.Run.Code == 0

	return &CheckResponse{
		Accepted:  accepted,
		RunStderr: pistonResult.Run.Stderr,
	}, nil
}

// generateCombinedCode creates a combined C++ source that includes checker code and wrapper
func (s *Service) generateCombinedCode(checkerCode, input, output, expected string, testlibBytes []byte) string {
	// Escape input/output/expected for C++ raw string literal
	escapedInput := escapeForRawString(input)
	escapedOutput := escapeForRawString(output)
	escapedExpected := escapeForRawString(expected)

	result := ""

	// Include testlib.h first if available
	if len(testlibBytes) > 0 {
		result += fmt.Sprintf("// Testlib header\n%s\n\n", string(testlibBytes))
	}

	// Include standard headers
	result += `#include <fstream>
#include <cstdlib>
#include <cstring>

`

	// Rename main() in checker code to checker_main() using macro
	// We'll define a macro before including checker code
	result += `// Rename main() to checker_main() before including checker code
#define main checker_main

// Checker code starts here
`

	// Add checker code
	result += checkerCode
	result += "\n\n"

	// Undefine the macro
	result += `// Undefine macro to restore main()
#undef main

`

	// Add wrapper main() that writes files and calls checker_main()
	result += fmt.Sprintf(`// Wrapper main() that writes files and calls checker
int main() {
	// Write input file
	std::ofstream inputFile("input");
	inputFile << R"CHECKER_DELIM(%s)CHECKER_DELIM";
	inputFile.close();
	
	// Write output file
	std::ofstream outputFile("output");
	outputFile << R"CHECKER_DELIM(%s)CHECKER_DELIM";
	outputFile.close();
	
	// Write expected file
	std::ofstream expectedFile("expected");
	expectedFile << R"CHECKER_DELIM(%s)CHECKER_DELIM";
	expectedFile.close();
	
	// Call checker's main (renamed to checker_main) with file arguments
	char* args[] = {"checker", "input", "output", "expected"};
	return checker_main(4, args);
}`, escapedInput, escapedOutput, escapedExpected)

	return result
}

// escapeForRawString escapes content for C++ raw string literal with custom delimiter
// Uses delimiter "CHECKER_DELIM" to avoid conflicts with content containing )"
func escapeForRawString(s string) string {
	// If content contains the delimiter, we need to escape it, but that's unlikely
	// For now, just return as-is since we're using a unique delimiter
	return s
}

// deriveCheckerPathFromStatement derives checker path from statement path
// e.g., "big_integer/addition_of_big_integers/statement.en.md" -> "big_integer/addition_of_big_integers/checker.cpp"
func deriveCheckerPathFromStatement(statementPath string) string {
	// Remove the filename (statement.en.md) and replace with checker.cpp
	// Find the last slash
	lastSlash := strings.LastIndex(statementPath, "/")
	if lastSlash == -1 {
		// No slash found, just return checker.cpp
		return "checker.cpp"
	}

	// Get the directory part and append checker.cpp
	dir := statementPath[:lastSlash]
	return dir + "/checker.cpp"
}

// mapVersionToPiston maps runtime image/version to Piston version
func (s *Service) mapVersionToPiston(version, runtimeImage string) string {
	// Default Piston C++ version
	defaultVersion := "10.2.0"

	// If version is specified, try to use it
	if version != "" {
		// Piston uses versions like "10.2.0" for C++, not "gnu++17"
		// But "gnu++17" is a standard, not a version
		// For now, return default version
		// You may need to map your versions to Piston versions
		if strings.HasPrefix(version, "gnu++") {
			// gnu++17 means C++17 standard, use appropriate compiler version
			return defaultVersion
		}
		return defaultVersion
	}

	return defaultVersion
}
