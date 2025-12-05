package worker

import (
	"codehustle/backend/internal/config"
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/queue"
	"codehustle/backend/internal/storage"
	"context"

	"github.com/sirupsen/logrus"
)

// InitializeServices initializes all required services (database, MinIO, Redis)
func InitializeServices(logger *logrus.Logger, consumerGroup string) error {
	// Initialize database
	if err := db.Connect(); err != nil {
		logger.WithError(err).Fatal("Failed to connect to database")
		return err
	}
	logger.Info("Connected to database")

	// Initialize MinIO
	if err := storage.InitMinIO(); err != nil {
		logger.WithError(err).Fatal("Failed to initialize MinIO")
		return err
	}
	logger.Info("Connected to MinIO")

	// Initialize Redis
	redisAddr := config.Get("REDIS_ADDR")
	redisPassword := config.Get("REDIS_PASSWORD")
	if err := queue.InitRedis(redisAddr, redisPassword); err != nil {
		logger.WithError(err).Fatal("Failed to initialize Redis")
		return err
	}
	logger.Info("Connected to Redis")

	// Ensure consumer group exists
	ctx := context.Background()
	if err := queue.EnsureConsumerGroup(ctx, "judge:submissions", consumerGroup); err != nil {
		logger.WithError(err).Warn("Failed to create consumer group (may already exist)")
	}

	return nil
}
