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
	"DB_PORT":     "3306",
	"DB_USER":     "root",
	"DB_PASSWORD": "123",
	"DB_NAME":     "businessdb",
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
