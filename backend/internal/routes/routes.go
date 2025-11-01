package routes

import (
	"github.com/gin-gonic/gin"

	"codehustle/backend/internal/handlers"
	"codehustle/backend/internal/middleware"
)

// RegisterRoutes sets up the API routes for the business backend
func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api/v1")

	// Course routes
	api.GET("/courses", middleware.RequireRole("student", "lecturer", "admin"), handlers.ListCourses)

	// Assignment routes
	api.GET("/assignments", middleware.RequireRole("lecturer", "admin"), handlers.ListAssignments)

	// Submission routes
	api.GET("/submissions", middleware.RequireRole("student", "lecturer", "admin"), handlers.ListSubmissions)
}
