package config

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

var defaults = map[string]string{
	"ENV":  "development",
	"PORT": "8080",

	// Legacy (unused once RS256 is enabled), kept to avoid breaking
	"JWT_SECRET": "changeme_dev",

	// DB
	"DB_DIALECT":  "mysql",
	"DB_HOST":     "127.0.0.1",
	"DB_PORT":     "3306",
	"DB_USER":     "root",
	"DB_PASSWORD": "123",
	"DB_NAME":     "authdb",

	// JWT / JWKS
	"JWT_ISS":            "http://localhost:8080",
	"JWT_AUD":            "codehustle",
	"ACCESS_TTL_MINUTES": "15",
	"REFRESH_TTL_DAYS":   "120",
	"KEY_DIR":            "./configs/keys",
	"ACTIVE_KID":         "dev1",

	// Cookies / CORS
	"COOKIE_DOMAIN":   "",
	"COOKIE_SECURE":   "false",
	"COOKIE_SAMESITE": "Lax",
	"FRONTEND_ORIGIN": "http://localhost:5173",

	// Azure OIDC (single-tenant)
	"AZURE_TENANT_ID":     "",
	"AZURE_CLIENT_ID":     "",
	"AZURE_CLIENT_SECRET": "",
	"AZURE_REDIRECT_URI":  "http://localhost:8080/api/v1/auth/oidc/azure/callback",

	// Service token
	"SERVICE_TOKEN_TTL_MINUTES": "15",
}

func LoadEnv() {
	paths := []string{".env", "./configs/.env", "./configs/.env.local"}
	for _, p := range paths {
		_ = godotenv.Overload(p)
	}
}

func EnsureDefaults() {
	for k, v := range defaults {
		if strings.TrimSpace(os.Getenv(k)) == "" {
			_ = os.Setenv(k, v)
		}
	}
}

func Get(key string) string {
	return os.Getenv(key)
}
