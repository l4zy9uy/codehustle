package middleware

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
)

// UserContext holds the authenticated user info from auth service
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

// AuthMiddleware validates JWT tokens by proxying to the external auth service
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing_token"})
			return
		}

		// Proxy the /me request to the auth service
		req, err := http.NewRequest("GET", "http://localhost:8080/api/v1/me", nil)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "auth_proxy_error"})
			return
		}
		req.Header.Set("Authorization", authHeader)

		resp, err := http.DefaultClient.Do(req)
		if err != nil || resp.StatusCode != http.StatusOK {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid_token"})
			return
		}
		defer resp.Body.Close()

		var userCtx UserContext
		if err := json.NewDecoder(resp.Body).Decode(&userCtx); err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid_user_response"})
			return
		}
		// Store user context for downstream handlers
		c.Set("user", userCtx)
		c.Next()
	}
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
