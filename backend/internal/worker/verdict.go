package worker

import (
	"codehustle/backend/internal/judge"
	"codehustle/backend/internal/models"

	"github.com/sirupsen/logrus"
)

// DetermineVerdict determines the verdict for a test case based on execution result
func DetermineVerdict(
	logger *logrus.Logger,
	submissionID string,
	tc models.TestCase,
	result *judge.ExecutionResult,
	expectedOutput string,
	input string,
	judgeConfig *models.ProblemJudge,
	statementPath string,
) (verdict string, score int, userOutputPath *string, err error) {
	verdict = "wrong_answer"
	score = 0

	if result.Compile.Code != 0 {
		verdict = "compile_error"
		logger.WithFields(logrus.Fields{
			"submission_id":  submissionID,
			"test_case_id":   tc.ID,
			"test_case_name": tc.Name,
			"compile_stderr": result.Compile.Stderr,
		}).Warn("Compile error for test case")
		return verdict, score, nil, nil
	}

	if result.Run.Code != 0 {
		verdict = "runtime_error"
		logger.WithFields(logrus.Fields{
			"submission_id":  submissionID,
			"test_case_id":   tc.ID,
			"test_case_name": tc.Name,
			"run_stderr":     result.Run.Stderr,
			"run_code":       result.Run.Code,
		}).Warn("Runtime error for test case")
		return verdict, score, nil, nil
	}

	// Check output using checker
	logger.WithFields(logrus.Fields{
		"submission_id": submissionID,
		"test_case_id":  tc.ID,
		"checker_kind":  judgeConfig.CheckerKind,
	}).Debug("Checking output with checker")

	accepted, err := judge.CheckOutput(judgeConfig, result.Run.Stdout, expectedOutput, input, statementPath)
	if err != nil {
		logger.WithFields(logrus.Fields{
			"submission_id":  submissionID,
			"test_case_id":   tc.ID,
			"test_case_name": tc.Name,
			"error":          err,
		}).Error("Checker error for test case")
		return "system_error", score, nil, err
	}

	if accepted {
		verdict = "accepted"
		score = tc.Weight
		if tc.Weight == 0 {
			score = 1 // Default weight
		}
		logger.WithFields(logrus.Fields{
			"submission_id":  submissionID,
			"test_case_id":   tc.ID,
			"test_case_name": tc.Name,
			"score":          score,
		}).Info("Test case passed")
	} else {
		verdict = "wrong_answer"
		// userOutputPath will be set by the caller after storing output
	}

	return verdict, score, nil, nil
}

// CalculateFinalStatus calculates the final submission status based on results
func CalculateFinalStatus(compileLog *string, passed int, totalTestCases int) string {
	if compileLog != nil && len(*compileLog) > 0 {
		// If there's a compile error, the submission failed to compile
		return "compile_error"
	}
	if passed == totalTestCases {
		return "accepted"
	}
	if passed == 0 {
		return "wrong_answer"
	}
	return "partial"
}
