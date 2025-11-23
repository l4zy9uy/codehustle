package routes

import (
	"github.com/gin-gonic/gin"

	"codehustle/backend/internal/constants"
	"codehustle/backend/internal/handlers"
	"codehustle/backend/internal/middleware"
)

// RegisterRoutes sets up the API routes for the business backend
func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api/v1")

	// Public endpoints (no auth required)
	api.POST("/register", handlers.RegisterUser)
	api.POST("/login", handlers.Login)
	api.GET("/auth/google", handlers.GoogleLogin)
	api.GET("/auth/google/callback", handlers.GoogleCallbackGET)
	api.POST("/auth/google/callback", handlers.GoogleCallback)

	// Protected endpoints (require auth)
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware())

	// User routes
	protected.GET("/me", handlers.GetMe)

	// Course routes
	protected.GET("/courses", middleware.RequireRole(constants.StudentRoles...), handlers.ListCourses)

	// Assignment routes
	protected.GET("/assignments", middleware.RequireRole(constants.InstructorRoles...), handlers.ListAssignments)

	// Submission routes
	protected.GET("/submissions", middleware.RequireRole(constants.StudentRoles...), handlers.ListSubmissions)
	protected.GET("/submissions/:id", middleware.RequireRole(constants.StudentRoles...), handlers.GetSubmission)
	protected.POST("/problems/:id/submit", middleware.RequireRole(constants.StudentRoles...), handlers.SubmitProblem)

	// Problem routes
	protected.GET("/problems", middleware.RequireRole(constants.StudentRoles...), handlers.ListProblems)
	protected.GET("/problems/:id", middleware.RequireRole(constants.StudentRoles...), handlers.GetProblem)
	protected.POST("/problems", middleware.RequireRole(constants.InstructorRoles...), handlers.CreateProblem)
	protected.PUT("/problems/:id", middleware.RequireRole(constants.InstructorRoles...), handlers.UpdateProblem)
	protected.DELETE("/problems/:id", middleware.RequireRole(constants.InstructorRoles...), handlers.DeleteProblem)

	// Announcement routes
	protected.GET("/announcements", handlers.ListAnnouncements)
	protected.GET("/announcements/:id", handlers.GetAnnouncement)
	protected.POST("/announcements", middleware.RequireRole(constants.AdminRoles...), handlers.CreateAnnouncement)
	protected.PUT("/announcements/:id", middleware.RequireRole(constants.AdminRoles...), handlers.UpdateAnnouncement)
	protected.DELETE("/announcements/:id", middleware.RequireRole(constants.AdminRoles...), handlers.DeleteAnnouncement)
	protected.POST("/announcements/:id/read", handlers.MarkAnnouncementRead)
}
