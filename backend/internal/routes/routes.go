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
	protected.POST("/users/batch", middleware.RequireRole(constants.AdminRoles...), handlers.BatchCreateAccounts)
	
	// Admin user management routes
	protected.GET("/admin/users", middleware.RequireRole(constants.AdminRoles...), handlers.ListAdminUsers)
	protected.POST("/admin/users", middleware.RequireRole(constants.AdminRoles...), handlers.CreateAdminUser)
	protected.PUT("/admin/users/:id", middleware.RequireRole(constants.AdminRoles...), handlers.UpdateAdminUser)
	protected.DELETE("/admin/users", middleware.RequireRole(constants.AdminRoles...), handlers.DeleteAdminUsers)
	protected.DELETE("/admin/users/:id", middleware.RequireRole(constants.AdminRoles...), handlers.DeleteAdminUsers)

	// Course routes
	protected.GET("/courses", middleware.RequireRole(constants.StudentRoles...), handlers.ListCourses)

	// Assignment routes
	protected.GET("/assignments", middleware.RequireRole(constants.InstructorRoles...), handlers.ListAssignments)

	// Submission routes
	protected.GET("/submissions", middleware.RequireRole(constants.StudentRoles...), handlers.ListSubmissions)
	protected.GET("/submissions/:id", middleware.RequireRole(constants.StudentRoles...), handlers.GetSubmission)
	protected.GET("/problems/:id/submissions", middleware.RequireRole(constants.StudentRoles...), handlers.GetProblemSubmissions)
	protected.POST("/problems/:id/submit", middleware.RequireRole(constants.StudentRoles...), handlers.SubmitProblem)

	// Problem routes
	protected.GET("/problems", middleware.RequireRole(constants.StudentRoles...), handlers.ListProblems)
	protected.GET("/problems/:id", middleware.RequireRole(constants.StudentRoles...), handlers.GetProblem)
	protected.POST("/problems", middleware.RequireRole(constants.InstructorRoles...), handlers.CreateProblem)
	protected.PUT("/problems/:id", middleware.RequireRole(constants.InstructorRoles...), handlers.UpdateProblem)
	protected.DELETE("/problems/:id", middleware.RequireRole(constants.InstructorRoles...), handlers.DeleteProblem)
	
	// Test case routes
	protected.POST("/problems/:id/test-cases/upload", middleware.RequireRole(constants.InstructorRoles...), handlers.BulkUploadTestCases)
	protected.DELETE("/problems/:id/test-cases", middleware.RequireRole(constants.InstructorRoles...), handlers.DeleteTestCases)
	protected.DELETE("/problems/:id/test-cases/:test_case_id", middleware.RequireRole(constants.InstructorRoles...), handlers.DeleteTestCases)

	// Announcement routes
	protected.GET("/announcements", handlers.ListAnnouncements)
	protected.GET("/announcements/:id", handlers.GetAnnouncement)
	protected.POST("/announcements", middleware.RequireRole(constants.AdminRoles...), handlers.CreateAnnouncement)
	protected.PUT("/announcements/:id", middleware.RequireRole(constants.AdminRoles...), handlers.UpdateAnnouncement)
	protected.DELETE("/announcements/:id", middleware.RequireRole(constants.AdminRoles...), handlers.DeleteAnnouncement)
	protected.POST("/announcements/:id/read", handlers.MarkAnnouncementRead)

	// Contest routes
	protected.GET("/contests", handlers.ListContests)
	protected.GET("/contests/:id", handlers.GetContest)
	protected.POST("/contests", middleware.RequireRole(constants.InstructorRoles...), handlers.CreateContest)
	protected.PUT("/contests/:id", middleware.RequireRole(constants.InstructorRoles...), handlers.UpdateContest)
	protected.DELETE("/contests/:id", middleware.RequireRole(constants.InstructorRoles...), handlers.DeleteContest)
	
	// Contest participation routes
	protected.POST("/contests/:id/password", handlers.VerifyContestPassword)
	protected.POST("/contests/:id/register", handlers.RegisterForContest)
	protected.POST("/contests/:id/unregister", handlers.UnregisterFromContest)
	protected.GET("/contests/:id/participants", handlers.ListContestParticipants)
	
	// Contest problem routes
	protected.GET("/contests/:id/problems", handlers.ListContestProblems)
	protected.GET("/contests/:id/problems/:problem_id", handlers.GetContestProblem)
	protected.POST("/contests/:id/problems", middleware.RequireRole(constants.InstructorRoles...), handlers.AddProblemToContest)
	protected.PUT("/contests/:id/problems/:problem_id", middleware.RequireRole(constants.InstructorRoles...), handlers.UpdateContestProblem)
	protected.DELETE("/contests/:id/problems/:problem_id", middleware.RequireRole(constants.InstructorRoles...), handlers.RemoveProblemFromContest)
	
	// Contest submission routes
	protected.POST("/contests/:id/problems/:problem_id/submit", handlers.SubmitContestProblem)
	protected.GET("/contests/:id/submissions", handlers.ListContestSubmissions)
	protected.GET("/contests/:id/submissions/:submission_id", handlers.GetContestSubmission)
	protected.GET("/contests/:id/problems/:problem_id/submissions", handlers.ListContestProblemSubmissions)
}
