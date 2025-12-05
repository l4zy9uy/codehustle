package worker

import (
	"codehustle/backend/internal/judge"
	"codehustle/backend/internal/models"

	"github.com/sirupsen/logrus"
)

// TestCaseResult represents the result of executing a test case
type TestCaseResult struct {
	TestCaseID     string
	Verdict        string
	Score          int
	TimeMs         int
	MemoryKb       int
	UserOutputPath *string
	CompileLog     *string
	RunLog         *string
}

// ExecuteTestCase executes code for a single test case
func ExecuteTestCase(
	logger *logrus.Logger,
	submissionID string,
	tc models.TestCase,
	testCaseNum int,
	totalTestCases int,
	code string,
	language string,
	languageVersion string,
	inputBytes []byte,
	timeLimitMs int,
	memoryLimitKb int,
) (*judge.ExecutionResult, error) {
	logger.WithFields(logrus.Fields{
		"submission_id":   submissionID,
		"test_case_id":    tc.ID,
		"test_case_name":  tc.Name,
		"test_case_num":   testCaseNum + 1,
		"input_length":    len(inputBytes),
		"code_length":     len(code),
		"language":        language,
		"version":         languageVersion,
		"time_limit_ms":   timeLimitMs,
		"memory_limit_kb": memoryLimitKb,
	}).Debug("Executing code for test case")

	result, err := judge.ExecuteCode(code, language, languageVersion, string(inputBytes), timeLimitMs, memoryLimitKb)
	if err != nil {
		logger.WithFields(logrus.Fields{
			"submission_id":  submissionID,
			"test_case_id":   tc.ID,
			"test_case_name": tc.Name,
			"error":          err,
		}).Error("Error executing code for test case")
		return nil, err
	}

	logger.WithFields(logrus.Fields{
		"submission_id":         submissionID,
		"test_case_id":          tc.ID,
		"test_case_name":        tc.Name,
		"compile_code":          result.Compile.Code,
		"run_code":              result.Run.Code,
		"run_memory_bytes":      result.Run.Memory,
		"compile_stdout_length": len(result.Compile.Stdout),
		"compile_stderr_length": len(result.Compile.Stderr),
		"run_stdout_length":     len(result.Run.Stdout),
		"run_stderr_length":     len(result.Run.Stderr),
	}).Debug("Piston execution completed for test case")

	return result, nil
}
