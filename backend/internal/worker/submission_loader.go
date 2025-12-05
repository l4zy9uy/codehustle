package worker

import (
	"fmt"

	"codehustle/backend/internal/models"
	"codehustle/backend/internal/repository"
	"codehustle/backend/internal/storage"

	"github.com/sirupsen/logrus"
)

// SubmissionData contains all data needed to process a submission
type SubmissionData struct {
	Submission      *models.Submission
	Problem         *models.Problem
	TestCases       []models.TestCase
	JudgeConfig     *models.ProblemJudge
	LanguageVersion string
}

// LoadSubmissionData loads all necessary data for processing a submission
func LoadSubmissionData(logger *logrus.Logger, submissionID, problemIDFromJob, language, languageVersion string) (*SubmissionData, error) {
	// Load submission record first to get the actual problem_id (source of truth)
	submission, err := repository.GetSubmission(submissionID)
	if err != nil {
		return nil, fmt.Errorf("failed to load submission: %w", err)
	}

	// Use problem_id from submission record, not from job
	problemID := submission.ProblemID

	logger.WithFields(logrus.Fields{
		"submission_id":       submissionID,
		"problem_id_from_job": problemIDFromJob,
		"problem_id_from_db":  problemID,
	}).Info("Loaded submission, verifying problem_id")

	// Verify problem_id matches (sanity check)
	if problemIDFromJob != problemID {
		logger.WithFields(logrus.Fields{
			"submission_id":       submissionID,
			"problem_id_from_job": problemIDFromJob,
			"problem_id_from_db":  problemID,
		}).Warn("Problem ID mismatch between job and submission record, using submission record")
	}

	// Load problem to get time/memory limits using problem_id from submission
	problem, err := repository.GetProblem(problemID)
	if err != nil {
		return nil, fmt.Errorf("failed to load problem: %w", err)
	}

	logger.WithFields(logrus.Fields{
		"problem_id":     problemID,
		"problem_title":  problem.Title,
		"statement_path": problem.StatementPath,
	}).Info("Loaded problem for submission")

	// Verify statement path exists in MinIO before using it
	statementBucket := storage.GetProblemStatementsBucket()
	if statementBucket == "" {
		statementBucket = "problem-statements"
	}
	_, err = storage.GetFile(statementBucket, problem.StatementPath)
	if err != nil {
		logger.WithFields(logrus.Fields{
			"problem_id":     problemID,
			"statement_path": problem.StatementPath,
			"bucket":         statementBucket,
			"error":          err,
		}).Error("Problem statement path does not exist in MinIO - database may have incorrect path")
		// Continue anyway, but this indicates a data issue
	}

	// Load test cases
	testCases, err := repository.GetTestCasesByProblemID(problemID)
	if err != nil {
		return nil, fmt.Errorf("failed to load test cases: %w", err)
	}
	if len(testCases) == 0 {
		return nil, fmt.Errorf("no test cases found for problem %s", problemID)
	}

	// Load judge configuration
	judgeConfig, err := repository.GetProblemJudgeByProblemID(problemID)
	if err != nil {
		logger.WithFields(logrus.Fields{
			"problem_id": problemID,
		}).Warn("No judge config found, using default diff checker")
		judgeConfig = &models.ProblemJudge{
			CheckerKind: "diff",
		}
	}

	// Resolve language version
	resolvedVersion := ResolveLanguageVersion(language, languageVersion)

	return &SubmissionData{
		Submission:      submission,
		Problem:         problem,
		TestCases:       testCases,
		JudgeConfig:     judgeConfig,
		LanguageVersion: resolvedVersion,
	}, nil
}

// ResolveLanguageVersion resolves the language version, using defaults if needed
func ResolveLanguageVersion(language, languageVersion string) string {
	if languageVersion != "" && languageVersion != "latest" {
		return languageVersion
	}

	// Default versions
	switch language {
	case "cpp":
		return "10.2.0"
	case "python":
		return "3.12.0"
	case "java":
		return "17.0.2"
	case "javascript":
		return "18.19.0"
	case "go":
		return "1.22.0"
	case "rust":
		return "1.75.0"
	default:
		return "latest"
	}
}
