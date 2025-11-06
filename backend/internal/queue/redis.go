package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

var redisClient *redis.Client

// InitRedis initializes the Redis client
func InitRedis(addr, password string) error {
	opts := &redis.Options{
		Addr: addr,
		DB:   0,
	}

	// Only set password if it's provided
	if password != "" {
		opts.Password = password
	}

	client := redis.NewClient(opts)

	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	redisClient = client
	return nil
}

// GetRedisClient returns the Redis client instance
func GetRedisClient() *redis.Client {
	return redisClient
}

// JudgeJob represents a job to be processed by the judge worker
type JudgeJob struct {
	SubmissionID    string `json:"submission_id"`
	ProblemID       string `json:"problem_id"`
	UserID          string `json:"user_id"`
	Code            string `json:"code"`
	Language        string `json:"language"`
	LanguageVersion string `json:"language_version,omitempty"`
	CourseID        string `json:"course_id,omitempty"`
	ContestID       string `json:"contest_id,omitempty"`
}

// EnqueueJudgeJob adds a judge job to the Redis Stream
func EnqueueJudgeJob(ctx context.Context, job *JudgeJob) (string, error) {
	if redisClient == nil {
		return "", fmt.Errorf("Redis client not initialized")
	}

	// Serialize job to JSON
	jobJSON, err := json.Marshal(job)
	if err != nil {
		return "", fmt.Errorf("failed to marshal job: %w", err)
	}

	// Add to stream
	streamID, err := redisClient.XAdd(ctx, &redis.XAddArgs{
		Stream: "judge:submissions",
		Values: map[string]interface{}{
			"data": string(jobJSON),
		},
	}).Result()

	if err != nil {
		return "", fmt.Errorf("failed to add job to stream: %w", err)
	}

	return streamID, nil
}

// ConsumeJudgeJobs reads jobs from Redis Stream using consumer group
func ConsumeJudgeJobs(ctx context.Context, consumerGroup, consumerName string, count int64) ([]JudgeJob, []string, error) {
	if redisClient == nil {
		return nil, nil, fmt.Errorf("Redis client not initialized")
	}

	// Read from stream
	streams, err := redisClient.XReadGroup(ctx, &redis.XReadGroupArgs{
		Group:    consumerGroup,
		Consumer: consumerName,
		Streams:  []string{"judge:submissions", ">"},
		Count:    count,
		Block:    5 * time.Second, // Block for 5 seconds
	}).Result()

	if err != nil {
		if err == redis.Nil {
			// No messages available
			return nil, nil, nil
		}
		return nil, nil, fmt.Errorf("failed to read from stream: %w", err)
	}

	if len(streams) == 0 || len(streams[0].Messages) == 0 {
		return nil, nil, nil
	}

	var jobs []JudgeJob
	var messageIDs []string

	for _, msg := range streams[0].Messages {
		messageIDs = append(messageIDs, msg.ID)

		// Extract data field
		dataStr, ok := msg.Values["data"].(string)
		if !ok {
			continue
		}

		// Parse JSON
		var job JudgeJob
		if err := json.Unmarshal([]byte(dataStr), &job); err != nil {
			continue
		}

		jobs = append(jobs, job)
	}

	return jobs, messageIDs, nil
}

// AcknowledgeMessage acknowledges a processed message
func AcknowledgeMessage(ctx context.Context, consumerGroup string, messageID string) error {
	if redisClient == nil {
		return fmt.Errorf("Redis client not initialized")
	}

	return redisClient.XAck(ctx, "judge:submissions", consumerGroup, messageID).Err()
}

// EnsureConsumerGroup ensures the consumer group exists
func EnsureConsumerGroup(ctx context.Context, streamName, groupName string) error {
	if redisClient == nil {
		return fmt.Errorf("Redis client not initialized")
	}

	// Try to create consumer group (ignores error if it already exists)
	_ = redisClient.XGroupCreate(ctx, streamName, groupName, "0").Err()
	return nil
}
