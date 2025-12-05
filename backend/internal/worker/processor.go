package worker

import (
	"context"
	"fmt"

	"codehustle/backend/internal/config"
	"codehustle/backend/internal/queue"
	"codehustle/backend/internal/repository"

	"github.com/sirupsen/logrus"
)

// SubmissionProcessor handles the processing of judge jobs
type SubmissionProcessor struct {
	logger *logrus.Logger
}

// NewSubmissionProcessor creates a new submission processor
func NewSubmissionProcessor(logger *logrus.Logger) *SubmissionProcessor {
	return &SubmissionProcessor{
		logger: logger,
	}
}

// Process handles a single judge job
func (p *SubmissionProcessor) Process(ctx context.Context, job *queue.JudgeJob) error {
	submissionID := job.SubmissionID

	// Load all submission data
	data, err := LoadSubmissionData(
		p.logger,
		submissionID,
		job.ProblemID,
		job.Language,
		job.LanguageVersion,
	)
	if err != nil {
		return fmt.Errorf("failed to load submission data: %w", err)
	}

	// Update submission status to "running"
	if err := repository.UpdateSubmissionStatus(submissionID, "running", nil, nil, nil, nil, nil); err != nil {
		return fmt.Errorf("failed to update submission status: %w", err)
	}

	p.logger.WithFields(logrus.Fields{
		"submission_id":    submissionID,
		"problem_id":       data.Problem.ID,
		"language":         job.Language,
		"version":          data.LanguageVersion,
		"total_test_cases": len(data.TestCases),
	}).Info("Starting submission processing")

	// Get test case bucket
	testCaseBucket := config.Get("BUCKET_TEST_CASES")
	if testCaseBucket == "" {
		testCaseBucket = "test-cases"
	}

	// Process each test case
	passed := 0
	totalScore := 0
	totalWeight := 0
	maxTimeMs := 0
	maxMemoryKb := 0
	var compileLog *string
	var runLog *string

	for testCaseNum, tc := range data.TestCases {
		p.logger.WithFields(logrus.Fields{
			"submission_id":    submissionID,
			"test_case_id":     tc.ID,
			"test_case_name":   tc.Name,
			"test_case_num":    testCaseNum + 1,
			"total_test_cases": len(data.TestCases),
			"is_sample":        tc.IsSample,
			"weight":           tc.Weight,
		}).Info("Processing test case")

		// Fetch test case data from storage
		inputBytes, expectedBytes, err := FetchTestCaseData(p.logger, submissionID, tc, testCaseBucket)
		if err != nil {
			// Store error result and continue
			StoreTestCaseResult(p.logger, submissionID, tc, testCaseNum, "system_error", 0, 0, 0, nil)
			continue
		}

		// Execute code for this test case
		result, err := ExecuteTestCase(
			p.logger,
			submissionID,
			tc,
			testCaseNum,
			len(data.TestCases),
			job.Code,
			job.Language,
			data.LanguageVersion,
			inputBytes,
			data.Problem.TimeLimitMs,
			data.Problem.MemoryLimitKb,
		)
		if err != nil {
			// Store error result and continue
			StoreTestCaseResult(p.logger, submissionID, tc, testCaseNum, "system_error", 0, 0, 0, nil)
			continue
		}

		// Accumulate logs
		compileLog, runLog = AccumulateLogs(p.logger, result, tc, compileLog, runLog)

		// Determine verdict
		verdict, score, userOutputPath, err := DetermineVerdict(
			p.logger,
			submissionID,
			tc,
			result,
			string(expectedBytes),
			string(inputBytes),
			data.JudgeConfig,
			data.Problem.StatementPath,
		)
		if err != nil {
			// Store error result and continue
			StoreTestCaseResult(p.logger, submissionID, tc, testCaseNum, "system_error", 0, 0, 0, nil)
			continue
		}

		// Store user output for wrong_answer cases
		if verdict == "wrong_answer" && result.Run.Stdout != "" {
			outputPath, err := StoreUserOutput(p.logger, submissionID, tc.ID, result.Run.Stdout)
			if err == nil {
				userOutputPath = outputPath
			}
		}

		// Calculate metrics
		memoryKb := result.Run.Memory / 1024
		timeMs := 0 // TODO: Extract from result if available

		if timeMs > maxTimeMs {
			maxTimeMs = timeMs
		}
		if memoryKb > maxMemoryKb {
			maxMemoryKb = memoryKb
		}

		if verdict == "accepted" {
			passed++
		}

		totalScore += score
		totalWeight += tc.Weight
		if tc.Weight == 0 {
			totalWeight += 1
		}

		// Store test case result
		if err := StoreTestCaseResult(
			p.logger,
			submissionID,
			tc,
			testCaseNum,
			verdict,
			score,
			timeMs,
			memoryKb,
			userOutputPath,
		); err != nil {
			// Log error but continue processing other test cases
			p.logger.WithError(err).Error("Failed to store test case result")
		}
	}

	// Determine final status
	finalStatus := CalculateFinalStatus(compileLog, passed, len(data.TestCases))

	// Update submission with final results
	if err := UpdateSubmissionFinalStatus(
		p.logger,
		submissionID,
		data.Problem.ID,
		finalStatus,
		totalScore,
		maxTimeMs,
		maxMemoryKb,
		compileLog,
		runLog,
		totalWeight,
		passed,
		len(data.TestCases),
	); err != nil {
		return err
	}

	return nil
}
