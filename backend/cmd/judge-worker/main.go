package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"codehustle/backend/internal/config"
	"codehustle/backend/internal/queue"
	"codehustle/backend/internal/worker"

	"github.com/sirupsen/logrus"
)

const (
	consumerGroup = "judge-workers"
	consumerName  = "worker-1"
)

func main() {
	logger := worker.NewLogger()
	logger.Info("Starting judge worker...")

	// Load configuration
	config.LoadEnv()
	config.EnsureDefaults()

	// Re-initialize logger with updated config
	logger = worker.NewLogger()

	// Initialize all services
	if err := worker.InitializeServices(logger, consumerGroup); err != nil {
		logger.WithError(err).Fatal("Failed to initialize services")
	}

	// Create submission processor
	processor := worker.NewSubmissionProcessor(logger)

	// Handle graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Main worker loop
	logger.Info("Starting to consume jobs...")
	ctx := context.Background()

	for {
		select {
		case <-sigChan:
			logger.Info("Shutting down...")
			return
		default:
			processJobs(ctx, logger, processor)
			time.Sleep(1 * time.Second) // Small delay between polls
		}
	}
}

func processJobs(ctx context.Context, logger *logrus.Logger, processor *worker.SubmissionProcessor) {
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
		if err := processor.Process(ctx, &job); err != nil {
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
