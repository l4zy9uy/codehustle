package routes

import (
	"codehustle/backend/auth/internal/handler"
	"codehustle/backend/auth/internal/middleware"

	"github.com/gin-gonic/gin"
)

// RegisterRoutes defines API endpoints
func RegisterRoutes(r *gin.RouterGroup) {
	v1 := r.Group("/v1")
	auth := v1.Group("/auth")
	{
		auth.POST("/login", handler.Login)
		auth.POST("/refresh", handler.Refresh)
		auth.POST("/logout", handler.Logout)

		auth.GET("/oidc/azure/start", handler.AzureStart)
		auth.GET("/oidc/azure/callback", handler.AzureCallback)

		auth.POST("/service/token", handler.ServiceToken)
	}
	v1.GET("/.well-known/jwks.json", handler.Jwks)

	v1Auth := v1.Group("/")
	// keep JWT auth only for /me endpoint
	v1Auth.Use(middleware.JWT())
	{
		v1Auth.GET("/me", handler.Me)
	}
}
