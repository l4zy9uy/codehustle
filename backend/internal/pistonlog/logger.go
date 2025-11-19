package pistonlog

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"

	"codehustle/backend/internal/config"

	"github.com/sirupsen/logrus"
)

var (
	pistonLogger     *logrus.Logger
	pistonLoggerOnce sync.Once
)

// GetLogger returns a logger instance for Piston API logs
func GetLogger() *logrus.Logger {
	pistonLoggerOnce.Do(func() {
		pistonLogger = logrus.New()
		pistonLogger.SetLevel(logrus.InfoLevel)
		pistonLogger.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: time.RFC3339,
		})

		// Get log file path from config or use default
		logPath := config.Get("PISTON_LOG_PATH")
		if logPath == "" {
			logPath = "logs/piston.log"
		}

		// Ensure directory exists
		dir := filepath.Dir(logPath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			logrus.WithError(err).Error("Failed to create piston log directory, using stderr")
			pistonLogger.SetOutput(os.Stderr)
			return
		}

		// Open log file in append mode
		file, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
		if err != nil {
			logrus.WithError(err).Error("Failed to open piston log file, using stderr")
			pistonLogger.SetOutput(os.Stderr)
			return
		}

		pistonLogger.SetOutput(file)
	})

	return pistonLogger
}

// sanitizePayload removes file content from payload and replaces with metadata
func sanitizePayload(payload map[string]interface{}) map[string]interface{} {
	sanitized := make(map[string]interface{})
	for k, v := range payload {
		if k == "files" {
			// Replace file content with metadata
			switch files := v.(type) {
			case []map[string]string:
				sanitizedFiles := make([]map[string]interface{}, len(files))
				for i, file := range files {
					sanitizedFile := make(map[string]interface{})
					for fk, fv := range file {
						if fk == "content" {
							// Replace content with size and preview
							contentLen := len(fv)
							preview := ""
							if contentLen > 0 {
								previewLen := 200
								if contentLen < previewLen {
									previewLen = contentLen
								}
								preview = fv[:previewLen]
							}
							sanitizedFile["content_size"] = contentLen
							sanitizedFile["content_preview"] = preview + "..."
						} else {
							sanitizedFile[fk] = fv
						}
					}
					sanitizedFiles[i] = sanitizedFile
				}
				sanitized[k] = sanitizedFiles
			case []interface{}:
				// Handle []map[string]interface{} case
				sanitizedFiles := make([]map[string]interface{}, len(files))
				for i, fileInterface := range files {
					if file, ok := fileInterface.(map[string]interface{}); ok {
						sanitizedFile := make(map[string]interface{})
						for fk, fv := range file {
							if fk == "content" {
								if contentStr, ok := fv.(string); ok {
									contentLen := len(contentStr)
									preview := ""
									if contentLen > 0 {
										previewLen := 200
										if contentLen < previewLen {
											previewLen = contentLen
										}
										preview = contentStr[:previewLen]
									}
									sanitizedFile["content_size"] = contentLen
									sanitizedFile["content_preview"] = preview + "..."
								} else {
									sanitizedFile[fk] = fv
								}
							} else {
								sanitizedFile[fk] = fv
							}
						}
						sanitizedFiles[i] = sanitizedFile
					} else {
						sanitizedFiles[i] = map[string]interface{}{"raw": fileInterface}
					}
				}
				sanitized[k] = sanitizedFiles
			default:
				sanitized[k] = v
			}
		} else if k == "stdin" {
			// Truncate stdin if it's too long
			if stdinStr, ok := v.(string); ok {
				const maxStdinLength = 500
				stdinLen := len(stdinStr)
				if stdinLen > maxStdinLength {
					sanitized[k] = stdinStr[:maxStdinLength] + "... [truncated]"
					sanitized["stdin_size"] = stdinLen
				} else {
					sanitized[k] = v
				}
			} else {
				sanitized[k] = v
			}
		} else {
			sanitized[k] = v
		}
	}
	return sanitized
}

// sanitizeResponse truncates large response bodies
func sanitizeResponse(responseBody []byte) string {
	const maxResponseLength = 5000
	responseStr := string(responseBody)
	if len(responseStr) > maxResponseLength {
		return responseStr[:maxResponseLength] + "... [truncated]"
	}
	return responseStr
}

// LogRequest logs a Piston API request to the file
func LogRequest(url string, payload map[string]interface{}, context map[string]interface{}) {
	logger := GetLogger()

	// Sanitize payload to remove full file contents
	sanitizedPayload := sanitizePayload(payload)
	payloadJSON, _ := json.Marshal(sanitizedPayload)

	logger.WithFields(logrus.Fields{
		"type":    "request",
		"url":     url,
		"payload": string(payloadJSON),
		"context": context,
		"time":    time.Now().Format(time.RFC3339),
	}).Info("Piston API Request")
}

// LogResponse logs a Piston API response to the file
func LogResponse(url string, statusCode int, responseBody []byte, context map[string]interface{}) {
	logger := GetLogger()

	// Sanitize response to truncate large bodies
	sanitizedResponse := sanitizeResponse(responseBody)

	logger.WithFields(logrus.Fields{
		"type":          "response",
		"url":           url,
		"status_code":   statusCode,
		"response":      sanitizedResponse,
		"response_size": len(responseBody),
		"context":       context,
		"time":          time.Now().Format(time.RFC3339),
	}).Info("Piston API Response")
}

// LogError logs a Piston API error to the file
func LogError(url string, err error, context map[string]interface{}) {
	logger := GetLogger()

	logger.WithFields(logrus.Fields{
		"type":    "error",
		"url":     url,
		"error":   err.Error(),
		"context": context,
		"time":    time.Now().Format(time.RFC3339),
	}).Error("Piston API Error")
}
