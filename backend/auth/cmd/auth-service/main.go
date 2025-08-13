package main

import (
	"fmt"
	"net/http"
	"strings"

	"codehustle/backend/auth/internal/config"
	"codehustle/backend/auth/internal/crypto"
	"codehustle/backend/auth/internal/db"
	"codehustle/backend/auth/internal/models"
	"codehustle/backend/auth/internal/routes"

	"github.com/gin-gonic/gin"
)

func cors() gin.HandlerFunc {
	origin := config.Get("FRONTEND_ORIGIN")
	return func(c *gin.Context) {
		orig := c.GetHeader("Origin")
		if origin != "" && strings.EqualFold(orig, origin) {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Vary", "Origin")
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
			c.Header("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS")
			if c.Request.Method == http.MethodOptions {
				c.AbortWithStatus(http.StatusNoContent)
				return
			}
		}
		c.Next()
	}
}

func main() {
	config.LoadEnv()
	config.EnsureDefaults()

	db.Connect()
	db.DB.AutoMigrate(&models.User{}, &models.Role{}, &models.UserRole{}, &models.OAuthIdentity{}, &models.RefreshToken{}, &models.EmailVerificationToken{}, &models.PasswordResetToken{}, &models.ServiceClient{}, &models.AuthAuditLog{})

	if err := crypto.LoadKeys(); err != nil {
		panic(err)
	}

	r := gin.Default()
	r.Use(cors())
	api := r.Group("/api")
	routes.RegisterRoutes(api)

	port := config.Get("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Println("Starting server on port", port)
	_ = r.Run(":" + port)
}
