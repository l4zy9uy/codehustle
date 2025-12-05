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
	admin := protected.Group("/admin")
	admin.Use(middleware.RequireRole(constants.AdminRoles...))
	admin.GET("/users", handlers.ListAdminUsers)
	admin.POST("/users", handlers.CreateAdminUser)
	admin.PUT("/users/:id", handlers.UpdateAdminUser)
	admin.DELETE("/users", handlers.DeleteAdminUsers)
	admin.DELETE("/users/:id", handlers.DeleteAdminUsers)

	// Admin problem routes
	admin.GET("/problems", handlers.AdminListProblems)
	admin.GET("/problems/:id", handlers.AdminGetProblem)
	admin.POST("/problems", handlers.AdminCreateProblem)
	admin.PUT("/problems/:id", handlers.AdminUpdateProblem)
	admin.DELETE("/problems/:id", handlers.AdminDeleteProblem)
	admin.GET("/problems/:id/export", handlers.AdminExportProblem)
	admin.POST("/problems/import", handlers.AdminImportProblem)

	// Admin test case routes
	admin.POST("/test_case", handlers.BulkUploadTestCases)
	admin.GET("/test_case", handlers.DownloadTestCases)

	// Admin contest problem routes
	admin.GET("/contest/problem", handlers.AdminListContestProblems)
	admin.GET("/contest/problem/:problem_id", handlers.AdminGetContestProblem)
	admin.POST("/contest/problem", handlers.AdminAddProblemToContest)
	admin.PUT("/contest/problem/:problem_id", handlers.AdminUpdateContestProblem)
	admin.DELETE("/contest/problem/:problem_id", handlers.AdminRemoveProblemFromContest)
	admin.POST("/contest_problem/make_public", handlers.AdminMakeContestProblemPublic)
	admin.POST("/contest/add_problem_from_public", handlers.AdminAddProblemFromPublic)

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
