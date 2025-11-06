package judge

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"codehustle/backend/internal/checker"
	"codehustle/backend/internal/config"
	"codehustle/backend/internal/models"
	"codehustle/backend/internal/storage"

	"github.com/sirupsen/logrus"

	"github.com/minio/minio-go/v7"
)

// ExecutionResult represents the result from Piston API
type ExecutionResult struct {
	Compile struct {
		Code   int    `json:"code"`
		Stdout string `json:"stdout"`
		Stderr string `json:"stderr"`
		Memory int    `json:"memory"`
	} `json:"compile"`
	Run struct {
		Code   int    `json:"code"`
		Stdout string `json:"stdout"`
		Stderr string `json:"stderr"`
		Memory int    `json:"memory"`
	} `json:"run"`
}

// Checker functions
func DiffChecker(output, expected string) bool {
	return strings.TrimSpace(output) == strings.TrimSpace(expected)
}

func TokenChecker(output, expected string) bool {
	outputTokens := strings.Fields(output)
	expectedTokens := strings.Fields(expected)

	if len(outputTokens) != len(expectedTokens) {
		return false
	}

	for i, token := range outputTokens {
		if token != expectedTokens[i] {
			return false
		}
	}
	return true
}

func FloatAbsChecker(output, expected string, epsilon float64) bool {
	outputTokens := strings.Fields(output)
	expectedTokens := strings.Fields(expected)

	if len(outputTokens) != len(expectedTokens) {
		return false
	}

	for i, token := range outputTokens {
		outputFloat, err1 := strconv.ParseFloat(token, 64)
		expectedFloat, err2 := strconv.ParseFloat(expectedTokens[i], 64)

		if err1 != nil || err2 != nil {
			if token != expectedTokens[i] {
				return false
			}
		} else {
			if math.Abs(outputFloat-expectedFloat) > epsilon {
				return false
			}
		}
	}
	return true
}

func FloatRelChecker(output, expected string, epsilon float64) bool {
	outputTokens := strings.Fields(output)
	expectedTokens := strings.Fields(expected)

	if len(outputTokens) != len(expectedTokens) {
		return false
	}

	for i, token := range outputTokens {
		outputFloat, err1 := strconv.ParseFloat(token, 64)
		expectedFloat, err2 := strconv.ParseFloat(expectedTokens[i], 64)

		if err1 != nil || err2 != nil {
			if token != expectedTokens[i] {
				return false
			}
		} else {
			if expectedFloat == 0 {
				if math.Abs(outputFloat) > epsilon {
					return false
				}
			} else {
				relDiff := math.Abs(outputFloat-expectedFloat) / math.Max(math.Abs(outputFloat), math.Abs(expectedFloat))
				if relDiff > epsilon {
					return false
				}
			}
		}
	}
	return true
}

func CustomChecker(minioClient *minio.Client, checkerPath string, input, output, expected string, runtimeImage, version, statementPath string) (bool, error) {
	// Use checker service to compile and run checker via Piston
	checkerService := checker.NewService(minioClient)

	resp, err := checkerService.Check(checker.CheckRequest{
		CheckerPath:   checkerPath,
		Input:         input,
		Output:        output,
		Expected:      expected,
		RuntimeImage:  runtimeImage,
		Version:       version,
		StatementPath: statementPath,
	})

	if err != nil {
		return false, err
	}

	if resp.Error != "" {
		return false, fmt.Errorf("%s", resp.Error)
	}

	return resp.Accepted, nil
}

// ExecuteCode executes user code via Piston API
func ExecuteCode(code, language, version, stdin string, timeLimitMs, memoryLimitKb int) (*ExecutionResult, error) {
	pistonURL := config.Get("PISTON_URL")
	if pistonURL == "" {
		pistonURL = "http://127.0.0.1:3002"
	}

	// Determine file name based on language
	// Use base filename without extension to avoid Piston adding duplicate extensions
	fileName := "main"
	switch language {
	case "python":
		fileName = "main.py"
	case "java":
		fileName = "Main.java"
	case "cpp", "c++":
		fileName = "main" // Piston will add .cpp extension automatically
	default:
		fileName = "main" // Default for C++
	}

	payload := map[string]interface{}{
		"language":        language,
		"version":         version,
		"files":           []map[string]string{{"name": fileName, "content": code}},
		"stdin":           stdin,
		"args":            []string{},
		"compile_timeout": 10000,
		"run_timeout":     timeLimitMs,
		"memory_limit":    memoryLimitKb * 1024,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	execURL := pistonURL + "/api/v2/execute"
	logrus.WithFields(logrus.Fields{
		"url":             execURL,
		"language":        language,
		"version":         version,
		"time_limit_ms":   timeLimitMs,
		"memory_limit_kb": memoryLimitKb,
		"stdin_length":    len(stdin),
	}).Debug("Piston request")

	logrus.WithField("payload", string(body)).Debug("Piston request payload")

	req, err := http.NewRequest(http.MethodPost, execURL, strings.NewReader(string(body)))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		logrus.WithError(err).Error("Piston HTTP request error")
		return nil, fmt.Errorf("piston execution error: %w", err)
	}
	defer resp.Body.Close()

	logrus.WithFields(logrus.Fields{
		"status_code": resp.StatusCode,
		"status":      resp.Status,
	}).Debug("Piston response status")

	b, err := io.ReadAll(resp.Body)
	if err != nil {
		logrus.WithError(err).Error("Error reading Piston response body")
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	logrus.WithField("response_body", string(b)).Debug("Piston response body")

	var result ExecutionResult
	if err := json.Unmarshal(b, &result); err != nil {
		logrus.WithError(err).Error("Error parsing Piston JSON response")
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"compile_code":          result.Compile.Code,
		"compile_stdout_length": len(result.Compile.Stdout),
		"compile_stderr_length": len(result.Compile.Stderr),
		"compile_memory":        result.Compile.Memory,
		"run_code":              result.Run.Code,
		"run_stdout_length":     len(result.Run.Stdout),
		"run_stderr_length":     len(result.Run.Stderr),
		"run_memory":            result.Run.Memory,
	}).Debug("Piston response parsed")

	logrus.WithField("compile_stdout", result.Compile.Stdout).Debug("Piston compile stdout")
	logrus.WithField("compile_stderr", result.Compile.Stderr).Debug("Piston compile stderr")
	logrus.WithField("run_stdout", result.Run.Stdout).Debug("Piston run stdout")
	logrus.WithField("run_stderr", result.Run.Stderr).Debug("Piston run stderr")

	return &result, nil
}

// CheckOutput checks output using the appropriate checker
func CheckOutput(judge *models.ProblemJudge, output, expected, input, statementPath string) (bool, error) {
	minioClient := storage.GetMinIOClient()
	if minioClient == nil {
		return false, fmt.Errorf("MinIO client not initialized")
	}

	switch judge.CheckerKind {
	case "diff":
		return DiffChecker(output, expected), nil
	case "token":
		return TokenChecker(output, expected), nil
	case "float_abs":
		epsilon := 1e-6
		if judge.CheckerArgs != nil && *judge.CheckerArgs != "" {
			var args map[string]interface{}
			if err := json.Unmarshal([]byte(*judge.CheckerArgs), &args); err == nil {
				if eps, ok := args["epsilon"].(float64); ok {
					epsilon = eps
				}
			}
		}
		return FloatAbsChecker(output, expected, epsilon), nil
	case "float_rel":
		epsilon := 1e-6
		if judge.CheckerArgs != nil && *judge.CheckerArgs != "" {
			var args map[string]interface{}
			if err := json.Unmarshal([]byte(*judge.CheckerArgs), &args); err == nil {
				if eps, ok := args["epsilon"].(float64); ok {
					epsilon = eps
				}
			}
		}
		return FloatRelChecker(output, expected, epsilon), nil
	case "custom":
		if judge.CheckerCustomPath == nil {
			return false, fmt.Errorf("custom checker path not provided")
		}
		runtimeImage := "gcc:14"
		version := "gnu++17"
		if judge.CheckerRuntimeImage != nil {
			runtimeImage = *judge.CheckerRuntimeImage
		}
		if judge.CheckerVersion != nil {
			version = *judge.CheckerVersion
		}
		return CustomChecker(minioClient, *judge.CheckerCustomPath, input, output, expected, runtimeImage, version, statementPath)
	default:
		return DiffChecker(output, expected), nil
	}
}
