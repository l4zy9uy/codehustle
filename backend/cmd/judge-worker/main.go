package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"codehustle/backend/internal/config"
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/judge"
	"codehustle/backend/internal/models"
	"codehustle/backend/internal/queue"
	"codehustle/backend/internal/repository"
	"codehustle/backend/internal/storage"

	"github.com/sirupsen/logrus"
)

const (
	consumerGroup = "judge-workers"
	consumerName  = "worker-1"
)

var logger *logrus.Logger

func initLogger() {
	logger = logrus.New()

	// Set log level from environment variable
	logLevel := config.Get("LOG_LEVEL")
	if logLevel == "" {
		logLevel = "info" // Default to info
	}

	level, err := logrus.ParseLevel(logLevel)
	if err != nil {
		logger.Warnf("Invalid log level '%s', using 'info'", logLevel)
		level = logrus.InfoLevel
	}
	logger.SetLevel(level)

	// Set formatter (JSON for structured logging, or Text for readable)
	format := config.Get("LOG_FORMAT")
	if format == "json" {
		logger.SetFormatter(&logrus.JSONFormatter{})
	} else {
		logger.SetFormatter(&logrus.TextFormatter{
			FullTimestamp: true,
		})
	}
}

func main() {
	initLogger()
	logger.Info("Starting judge worker...")

	// Load configuration
	config.LoadEnv()
	config.EnsureDefaults()

	// Re-initialize logger with updated config
	initLogger()

	// Initialize database
	if err := db.Connect(); err != nil {
		logger.WithError(err).Fatal("Failed to connect to database")
	}
	logger.Info("Connected to database")

	// Initialize MinIO
	if err := storage.InitMinIO(); err != nil {
		logger.WithError(err).Fatal("Failed to initialize MinIO")
	}
	logger.Info("Connected to MinIO")

	// Initialize Redis
	redisAddr := config.Get("REDIS_ADDR")
	redisPassword := config.Get("REDIS_PASSWORD")
	if err := queue.InitRedis(redisAddr, redisPassword); err != nil {
		logger.WithError(err).Fatal("Failed to initialize Redis")
	}
	logger.Info("Connected to Redis")

	// Ensure consumer group exists
	ctx := context.Background()
	if err := queue.EnsureConsumerGroup(ctx, "judge:submissions", consumerGroup); err != nil {
		logger.WithError(err).Warn("Failed to create consumer group (may already exist)")
	}

	// Handle graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Main worker loop
	logger.Info("Starting to consume jobs...")
	for {
		select {
		case <-sigChan:
			logger.Info("Shutting down...")
			return
		default:
			processJobs(ctx)
			time.Sleep(1 * time.Second) // Small delay between polls
		}
	}
}

func processJobs(ctx context.Context) {
	// Consume jobs from Redis Stream
	jobs, messageIDs, err := queue.ConsumeJudgeJobs(ctx, consumerGroup, consumerName, 10)
	if err != nil {
		logger.WithError(err).Error("Error consuming jobs")
		return
	}

	if len(jobs) == 0 {
		return // No jobs available
	}

	logger.WithField("count", len(jobs)).Info("Processing jobs")

	for i, job := range jobs {
		messageID := messageIDs[i]
		logger.WithFields(logrus.Fields{
			"submission_id": job.SubmissionID,
			"problem_id":    job.ProblemID,
			"language":      job.Language,
		}).Info("Processing job")

		// Process the submission
		if err := processSubmission(ctx, &job); err != nil {
			logger.WithFields(logrus.Fields{
				"submission_id": job.SubmissionID,
				"error":         err,
			}).Error("Error processing submission")
			// Don't acknowledge on error - let it retry later
			continue
		}

		// Acknowledge message
		if err := queue.AcknowledgeMessage(ctx, consumerGroup, messageID); err != nil {
			logger.WithFields(logrus.Fields{
				"message_id": messageID,
				"error":      err,
			}).Error("Error acknowledging message")
		} else {
			logger.WithField("submission_id", job.SubmissionID).Info("Successfully processed and acknowledged submission")
		}
	}
}

func processSubmission(ctx context.Context, job *queue.JudgeJob) error {
	submissionID := job.SubmissionID

	// Load submission record first to get the actual problem_id (source of truth)
	submission, err := repository.GetSubmission(submissionID)
	if err != nil {
		return fmt.Errorf("failed to load submission: %w", err)
	}

	// Use problem_id from submission record, not from job
	problemID := submission.ProblemID

	logger.WithFields(logrus.Fields{
		"submission_id":       submissionID,
		"problem_id_from_job": job.ProblemID,
		"problem_id_from_db":  problemID,
	}).Info("Loaded submission, verifying problem_id")

	// Verify problem_id matches (sanity check)
	if job.ProblemID != problemID {
		logger.WithFields(logrus.Fields{
			"submission_id":       submissionID,
			"problem_id_from_job": job.ProblemID,
			"problem_id_from_db":  problemID,
		}).Warn("Problem ID mismatch between job and submission record, using submission record")
	}

	// Update submission status to "running"
	if err := repository.UpdateSubmissionStatus(submissionID, "running", nil, nil, nil, nil, nil); err != nil {
		return fmt.Errorf("failed to update submission status: %w", err)
	}

	// Load problem to get time/memory limits using problem_id from submission
	problem, err := repository.GetProblem(problemID)
	if err != nil {
		return fmt.Errorf("failed to load problem: %w", err)
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
		return fmt.Errorf("failed to load test cases: %w", err)
	}
	if len(testCases) == 0 {
		return fmt.Errorf("no test cases found for problem %s", problemID)
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

	// Language version
	languageVersion := job.LanguageVersion
	if languageVersion == "" || languageVersion == "latest" {
		// Default versions
		switch job.Language {
		case "cpp":
			languageVersion = "10.2.0"
		case "python":
			languageVersion = "3.12.0"
		case "java":
			languageVersion = "17.0.2"
		case "javascript":
			languageVersion = "18.19.0"
		case "go":
			languageVersion = "1.22.0"
		case "rust":
			languageVersion = "1.75.0"
		default:
			languageVersion = "latest"
		}
	}

	logger.WithFields(logrus.Fields{
		"submission_id":    submissionID,
		"problem_id":       problemID,
		"language":         job.Language,
		"version":          languageVersion,
		"total_test_cases": len(testCases),
	}).Info("Starting submission processing")

	// Process each test case
	passed := 0
	totalScore := 0
	totalWeight := 0
	maxTimeMs := 0
	maxMemoryKb := 0
	var compileLog *string
	var runLog *string

	testCaseBucket := config.Get("BUCKET_TEST_CASES")
	if testCaseBucket == "" {
		testCaseBucket = "test-cases"
	}

	for testCaseNum, tc := range testCases {
		logger.WithFields(logrus.Fields{
			"submission_id":    submissionID,
			"test_case_id":     tc.ID,
			"test_case_name":   tc.Name,
			"test_case_num":    testCaseNum + 1,
			"total_test_cases": len(testCases),
			"is_sample":        tc.IsSample,
			"weight":           tc.Weight,
		}).Info("Processing test case")

		// Fetch test input and expected output from MinIO
		inputBytes, err := storage.GetFile(testCaseBucket, tc.InputPath)
		if err != nil {
			logger.WithFields(logrus.Fields{
				"submission_id":  submissionID,
				"test_case_id":   tc.ID,
				"test_case_name": tc.Name,
				"input_path":     tc.InputPath,
				"error":          err,
			}).Error("Error fetching input for test case")
			repository.CreateOrUpdateSubmissionTestCase(submissionID, tc.ID, "system_error", intPtr(0), nil, nil, nil)
			continue
		}

		expectedBytes, err := storage.GetFile(testCaseBucket, tc.ExpectedOutputPath)
		if err != nil {
			logger.WithFields(logrus.Fields{
				"submission_id":        submissionID,
				"test_case_id":         tc.ID,
				"test_case_name":       tc.Name,
				"expected_output_path": tc.ExpectedOutputPath,
				"error":                err,
			}).Error("Error fetching expected output for test case")
			repository.CreateOrUpdateSubmissionTestCase(submissionID, tc.ID, "system_error", intPtr(0), nil, nil, nil)
			continue
		}

		// Execute code
		logger.WithFields(logrus.Fields{
			"submission_id":          submissionID,
			"test_case_id":           tc.ID,
			"test_case_name":         tc.Name,
			"test_case_num":          testCaseNum + 1,
			"input_length":           len(inputBytes),
			"expected_output_length": len(expectedBytes),
			"code_length":            len(job.Code),
			"language":               job.Language,
			"version":                languageVersion,
			"time_limit_ms":          problem.TimeLimitMs,
			"memory_limit_kb":        problem.MemoryLimitKb,
		}).Debug("Executing code for test case")

		result, err := judge.ExecuteCode(job.Code, job.Language, languageVersion, string(inputBytes), problem.TimeLimitMs, problem.MemoryLimitKb)
		if err != nil {
			logger.WithFields(logrus.Fields{
				"submission_id":  submissionID,
				"test_case_id":   tc.ID,
				"test_case_name": tc.Name,
				"error":          err,
			}).Error("Error executing code for test case")
			repository.CreateOrUpdateSubmissionTestCase(submissionID, tc.ID, "system_error", intPtr(0), nil, nil, nil)
			continue
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

		// Determine verdict
		verdict := "wrong_answer"
		score := 0
		timeMs := 0
		memoryKb := result.Run.Memory / 1024
		var userOutputPath *string

		// Store compile log from first test case (compile happens once per submission)
		if compileLog == nil && result.Compile.Stderr != "" {
			compileLogStr := result.Compile.Stderr
			compileLog = &compileLogStr
		}

		if result.Compile.Code != 0 {
			verdict = "compile_error"
			logger.WithFields(logrus.Fields{
				"submission_id":  submissionID,
				"test_case_id":   tc.ID,
				"test_case_name": tc.Name,
				"compile_stderr": result.Compile.Stderr,
			}).Warn("Compile error for test case")
		} else if result.Run.Code != 0 {
			verdict = "runtime_error"
			logger.WithFields(logrus.Fields{
				"submission_id":  submissionID,
				"test_case_id":   tc.ID,
				"test_case_name": tc.Name,
				"run_stderr":     result.Run.Stderr,
				"run_code":       result.Run.Code,
			}).Warn("Runtime error for test case")
			// Accumulate run logs for runtime errors
			if result.Run.Stderr != "" {
				if runLog == nil {
					runLogStr := result.Run.Stderr
					runLog = &runLogStr
				} else {
					combined := *runLog + "\n--- Test Case: " + tc.Name + " ---\n" + result.Run.Stderr
					runLog = &combined
				}
			}
		} else {
			// Check output using checker
			logger.WithFields(logrus.Fields{
				"submission_id":  submissionID,
				"problem_id":     problemID,
				"statement_path": problem.StatementPath,
				"checker_kind":   judgeConfig.CheckerKind,
			}).Debug("Checking output with checker")

			accepted, err := judge.CheckOutput(judgeConfig, result.Run.Stdout, string(expectedBytes), string(inputBytes), problem.StatementPath)
			if err != nil {
				logger.WithFields(logrus.Fields{
					"submission_id":  submissionID,
					"test_case_id":   tc.ID,
					"test_case_name": tc.Name,
					"error":          err,
				}).Error("Checker error for test case")
				verdict = "system_error"
			} else if accepted {
				verdict = "accepted"
				score = tc.Weight
				if tc.Weight == 0 {
					score = 1 // Default weight
				}
				passed++
				logger.WithFields(logrus.Fields{
					"submission_id":  submissionID,
					"test_case_id":   tc.ID,
					"test_case_name": tc.Name,
					"score":          score,
				}).Info("Test case passed")
			} else {
				// Wrong answer - store user output in MinIO
				verdict = "wrong_answer"
				outputBucket := storage.GetTestCasesBucket()
				outputKey := fmt.Sprintf("submissions/%s/test_cases/%s/user_output.txt", submissionID, tc.ID)
				
				// Upload user output to MinIO
				outputReader := strings.NewReader(result.Run.Stdout)
				if err := storage.UploadFile(outputBucket, outputKey, outputReader, int64(len(result.Run.Stdout)), "text/plain"); err != nil {
					logger.WithFields(logrus.Fields{
						"submission_id":  submissionID,
						"test_case_id":   tc.ID,
						"test_case_name": tc.Name,
						"error":          err,
					}).Warn("Failed to store user output in MinIO")
				} else {
					userOutputPath = &outputKey
					logger.WithFields(logrus.Fields{
						"submission_id":          submissionID,
						"test_case_id":           tc.ID,
						"test_case_name":         tc.Name,
						"output_length":          len(result.Run.Stdout),
						"expected_output_length": len(expectedBytes),
						"user_output_path":       outputKey,
					}).Debug("Stored user output for wrong_answer test case")
				}
			}
			// Accumulate run logs even if no error (for warnings, etc.)
			if result.Run.Stderr != "" {
				if runLog == nil {
					runLogStr := result.Run.Stderr
					runLog = &runLogStr
				} else {
					combined := *runLog + "\n--- Test Case: " + tc.Name + " ---\n" + result.Run.Stderr
					runLog = &combined
				}
			}
		}

		// Update max time and memory
		if timeMs > maxTimeMs {
			maxTimeMs = timeMs
		}
		if memoryKb > maxMemoryKb {
			maxMemoryKb = memoryKb
		}

		totalScore += score
		totalWeight += tc.Weight
		if tc.Weight == 0 {
			totalWeight += 1
		}

		// Save test case result
		if err := repository.CreateOrUpdateSubmissionTestCase(submissionID, tc.ID, verdict, intPtr(score), intPtr(timeMs), intPtr(memoryKb), userOutputPath); err != nil {
			logger.WithFields(logrus.Fields{
				"submission_id":  submissionID,
				"test_case_id":   tc.ID,
				"test_case_name": tc.Name,
				"error":          err,
			}).Error("Error saving test case result")
		} else {
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
		}
	}

	// Determine final status
	finalStatus := "partial"
	if compileLog != nil && len(*compileLog) > 0 {
		// If there's a compile error, the submission failed to compile
		finalStatus = "compile_error"
	} else if passed == len(testCases) {
		finalStatus = "accepted"
	} else if passed == 0 {
		finalStatus = "wrong_answer"
	}

	// Update submission with final results (including logs)
	if err := repository.UpdateSubmissionStatus(submissionID, finalStatus, intPtr(totalScore), intPtr(maxTimeMs), intPtr(maxMemoryKb), compileLog, runLog); err != nil {
		return fmt.Errorf("failed to update submission status: %w", err)
	}

	logger.WithFields(logrus.Fields{
		"submission_id":     submissionID,
		"problem_id":        problemID,
		"status":            finalStatus,
		"score":             totalScore,
		"max_score":         totalWeight,
		"passed":            passed,
		"total_test_cases":  len(testCases),
		"execution_time_ms": maxTimeMs,
		"memory_usage_kb":   maxMemoryKb,
	}).Info("Submission processing completed")

	return nil
}

func intPtr(i int) *int {
	return &i
}
