package middleware

import (
	"net/http"
	"strings"

	"codehustle/backend/auth/internal/crypto"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

func JWT() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if !strings.HasPrefix(auth, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing_token"})
			return
		}
		tokenStr := strings.TrimPrefix(auth, "Bearer ")
		ks, err := crypto.Current()
		if err != nil {
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"error": "keys_unavailable"})
			return
		}
		token, err := jwt.ParseWithClaims(tokenStr, &crypto.AccessClaims{}, func(t *jwt.Token) (interface{}, error) {
			return ks.Pub, nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid_token"})
			return
		}
		claims := token.Claims.(*crypto.AccessClaims)
		c.Set("claims", claims)
		c.Next()
	}
}
