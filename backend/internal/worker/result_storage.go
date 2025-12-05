package worker

import (
	"fmt"
	"strings"

	"codehustle/backend/internal/judge"
	"codehustle/backend/internal/models"
	"codehustle/backend/internal/repository"
	"codehustle/backend/internal/storage"

	"github.com/sirupsen/logrus"
)

// StoreUserOutput stores user output to MinIO for wrong_answer cases
func StoreUserOutput(logger *logrus.Logger, submissionID, testCaseID, output string) (*string, error) {
	outputBucket := storage.GetTestCasesBucket()
	outputKey := fmt.Sprintf("submissions/%s/test_cases/%s/user_output.txt", submissionID, testCaseID)

	// Upload user output to MinIO
	outputReader := strings.NewReader(output)
	if err := storage.UploadFile(outputBucket, outputKey, outputReader, int64(len(output)), "text/plain"); err != nil {
		logger.WithFields(logrus.Fields{
			"submission_id": submissionID,
			"test_case_id":  testCaseID,
			"error":         err,
		}).Warn("Failed to store user output in MinIO")
		return nil, err
	}

	logger.WithFields(logrus.Fields{
		"submission_id":    submissionID,
		"test_case_id":     testCaseID,
		"output_length":    len(output),
		"user_output_path": outputKey,
	}).Debug("Stored user output for wrong_answer test case")

	return &outputKey, nil
}

// StoreTestCaseResult stores the result of a single test case
func StoreTestCaseResult(
	logger *logrus.Logger,
	submissionID string,
	tc models.TestCase,
	testCaseNum int,
	verdict string,
	score int,
	timeMs int,
	memoryKb int,
	userOutputPath *string,
) error {
	if err := repository.CreateOrUpdateSubmissionTestCase(
		submissionID,
		tc.ID,
		verdict,
		intPtr(score),
		intPtr(timeMs),
		intPtr(memoryKb),
		userOutputPath,
	); err != nil {
		logger.WithFields(logrus.Fields{
			"submission_id":  submissionID,
			"test_case_id":   tc.ID,
			"test_case_name": tc.Name,
			"error":          err,
		}).Error("Error saving test case result")
		return err
	}

	logger.WithFields(logrus.Fields{
		"submission_id":  submissionID,
		"test_case_id":   tc.ID,
		"test_case_name": tc.Name,
		"test_case_num":  testCaseNum + 1,
		"verdict":        verdict,
		"score":          score,
		"time_ms":        timeMs,
		"memory_kb":      memoryKb,
	}).Debug("Test case result saved")

	return nil
}

// UpdateSubmissionFinalStatus updates the final submission status with all results
func UpdateSubmissionFinalStatus(
	logger *logrus.Logger,
	submissionID string,
	problemID string,
	finalStatus string,
	totalScore int,
	maxTimeMs int,
	maxMemoryKb int,
	compileLog *string,
	runLog *string,
	totalWeight int,
	passed int,
	totalTestCases int,
) error {
	if err := repository.UpdateSubmissionStatus(
		submissionID,
		finalStatus,
		intPtr(totalScore),
		intPtr(maxTimeMs),
		intPtr(maxMemoryKb),
		compileLog,
		runLog,
	); err != nil {
		return fmt.Errorf("failed to update submission status: %w", err)
	}

	logger.WithFields(logrus.Fields{
		"submission_id":     submissionID,
		"problem_id":        problemID,
		"status":            finalStatus,
		"score":             totalScore,
		"max_score":         totalWeight,
		"passed":            passed,
		"total_test_cases":  totalTestCases,
		"execution_time_ms": maxTimeMs,
		"memory_usage_kb":   maxMemoryKb,
	}).Info("Submission processing completed")

	return nil
}

// AccumulateLogs accumulates compile and run logs from execution results
func AccumulateLogs(
	logger *logrus.Logger,
	result *judge.ExecutionResult,
	tc models.TestCase,
	compileLog *string,
	runLog *string,
) (*string, *string) {
	// Store compile log from first test case (compile happens once per submission)
	if compileLog == nil && result.Compile.Stderr != "" {
		compileLogStr := result.Compile.Stderr
		compileLog = &compileLogStr
	}

	// Accumulate run logs
	if result.Run.Stderr != "" {
		if runLog == nil {
			runLogStr := result.Run.Stderr
			runLog = &runLogStr
		} else {
			combined := *runLog + "\n--- Test Case: " + tc.Name + " ---\n" + result.Run.Stderr
			runLog = &combined
		}
	}

	return compileLog, runLog
}

// FetchTestCaseData fetches test case input and expected output from storage
func FetchTestCaseData(
	logger *logrus.Logger,
	submissionID string,
	tc models.TestCase,
	testCaseBucket string,
) (inputBytes []byte, expectedBytes []byte, err error) {
	// Fetch test input from MinIO
	inputBytes, err = storage.GetFile(testCaseBucket, tc.InputPath)
	if err != nil {
		logger.WithFields(logrus.Fields{
			"submission_id":  submissionID,
			"test_case_id":   tc.ID,
			"test_case_name": tc.Name,
			"input_path":     tc.InputPath,
			"error":          err,
		}).Error("Error fetching input for test case")
		return nil, nil, err
	}

	// Fetch expected output from MinIO
	expectedBytes, err = storage.GetFile(testCaseBucket, tc.ExpectedOutputPath)
	if err != nil {
		logger.WithFields(logrus.Fields{
			"submission_id":        submissionID,
			"test_case_id":         tc.ID,
			"test_case_name":       tc.Name,
			"expected_output_path": tc.ExpectedOutputPath,
			"error":                err,
		}).Error("Error fetching expected output for test case")
		return nil, nil, err
	}

	return inputBytes, expectedBytes, nil
}

// intPtr is a helper function to create an int pointer
func intPtr(i int) *int {
	return &i
}
