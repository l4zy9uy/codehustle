package routes

import (
	"github.com/gin-gonic/gin"

	"codehustle/backend/internal/handlers"
	"codehustle/backend/internal/middleware"
)

// RegisterRoutes sets up the API routes for the business backend
func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api/v1")

	// Public endpoints (no auth required)
	api.POST("/register", handlers.RegisterUser)
	api.POST("/login", handlers.Login)

	// Protected endpoints (require auth)
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware())

	// Course routes
	protected.GET("/courses", middleware.RequireRole("student", "lecturer", "admin"), handlers.ListCourses)

	// Assignment routes
	protected.GET("/assignments", middleware.RequireRole("lecturer", "admin"), handlers.ListAssignments)

	// Submission routes
	protected.GET("/submissions", middleware.RequireRole("student", "lecturer", "admin"), handlers.ListSubmissions)

	// Problem routes
	protected.GET("/problems", middleware.RequireRole("student", "lecturer", "admin"), handlers.ListProblems)
	protected.GET("/problems/:id", middleware.RequireRole("student", "lecturer", "admin"), handlers.GetProblem)
}
