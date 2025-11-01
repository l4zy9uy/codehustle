package config

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

var defaults = map[string]string{
	"ENV":  "development",
	"PORT": "8081",

	// Database
	"DB_DIALECT":  "mysql",
	"DB_HOST":     "127.0.0.1",
	"DB_PORT":     "2412",
	"DB_USER":     "root",
	"DB_PASSWORD": "rootpass",
	"DB_NAME":     "codehustle",

	// MinIO
	"MINIO_ENDPOINT":            "127.0.0.1:9000",
	"MINIO_ACCESS_KEY":          "minioadmin",
	"MINIO_SECRET_KEY":          "minioadmin123",
	"MINIO_SECURE":              "false",
	"BUCKET_PROBLEM_STATEMENTS": "problem-statements",
	"BUCKET_TEST_CASES":         "test-cases",
	"BUCKET_PROBLEM_CHECKERS":   "problem-checkers",
	"BUCKET_JUDGE_COMMON":       "judge-common",
	"BUCKET_CHECKERS_CACHE":     "checkers-cache",

	// Piston (executor)
	"PISTON_URL": "http://127.0.0.1:3002",
}

// LoadEnv loads environment variables from .env files
func LoadEnv() {
	paths := []string{".env", "./configs/.env", "./configs/.env.local"}
	for _, p := range paths {
		_ = godotenv.Overload(p)
	}
}

// EnsureDefaults sets default values for missing environment variables
func EnsureDefaults() {
	for k, v := range defaults {
		if strings.TrimSpace(os.Getenv(k)) == "" {
			_ = os.Setenv(k, v)
		}
	}
}

// Get returns the value of an environment variable
func Get(key string) string {
	return os.Getenv(key)
}
