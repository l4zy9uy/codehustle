package middleware

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"

	"codehustle/backend/internal/config"
)

// UserContext holds the authenticated user info from JWT token
type UserContext struct {
	ID    string   `json:"id"`
	Email string   `json:"email"`
	Roles []string `json:"roles"`
}

// CORSMiddleware sets CORS headers
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// AuthMiddleware validates JWT tokens directly
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing_token"})
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			log.Printf("[AUTH] Invalid token format: %s", authHeader)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid_token_format"})
			return
		}
		tokenString := parts[1]

		// Parse and validate token
		secret := config.Get("JWT_SECRET")
		if secret == "" {
			log.Printf("[AUTH] ERROR: JWT_SECRET is not configured")
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error":   "jwt_secret_not_configured",
				"message": "JWT_SECRET environment variable is not set",
			})
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secret), nil
		})

		if err != nil {
			log.Printf("[AUTH] Token validation failed: %v", err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_token",
				"message": err.Error(),
			})
			return
		}

		if !token.Valid {
			log.Printf("[AUTH] Token is not valid")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid_token"})
			return
		}

		// Extract claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			log.Printf("[AUTH] Invalid token claims format")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid_token_claims"})
			return
		}

		// Build user context from claims
		userCtx := UserContext{
			ID:    getStringClaim(claims, "sub"),
			Email: getStringClaim(claims, "email"),
		}

		// Extract roles (handle null/empty)
		if roles, ok := claims["roles"].([]interface{}); ok {
			userCtx.Roles = make([]string, 0, len(roles))
			for _, r := range roles {
				if role, ok := r.(string); ok {
					userCtx.Roles = append(userCtx.Roles, role)
				}
			}
		}

		log.Printf("[AUTH] Authenticated user: %s (%s)", userCtx.Email, userCtx.ID)
		// Store user context for downstream handlers
		c.Set("user", userCtx)
		c.Next()
	}
}

func getStringClaim(claims jwt.MapClaims, key string) string {
	if val, ok := claims[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

// RequireRole checks that the user has one of the allowed roles
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Retrieve user context
		val, exists := c.Get("user")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing_user_context"})
			return
		}

		userCtx, ok := val.(UserContext)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid_user_context"})
			return
		}

		// Check for any matching role
		for _, allowed := range allowedRoles {
			for _, r := range userCtx.Roles {
				if r == allowed {
					c.Next()
					return
				}
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient_permissions"})
	}
}
