package worker

import (
	"codehustle/backend/internal/config"

	"github.com/sirupsen/logrus"
)

// NewLogger creates and configures a new logger instance
func NewLogger() *logrus.Logger {
	logger := logrus.New()

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

	return logger
}
