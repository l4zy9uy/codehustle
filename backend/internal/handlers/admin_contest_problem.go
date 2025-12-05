package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"codehustle/backend/internal/constants"
	"codehustle/backend/internal/middleware"
	"codehustle/backend/internal/models"
	"codehustle/backend/internal/repository"
)

// AdminListContestProblems returns the problems for a contest (Admin only)
func AdminListContestProblems(c *gin.Context) {
	contestID := c.Query("contest_id")
	if contestID == "" {
		contestID = c.Param("contest_id")
	}
	if contestID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_contest_id"})
		return
	}

	log.Printf("[ADMIN_CONTEST_PROBLEM] AdminListContestProblems: contestID=%s", contestID)

	problems, err := repository.ListContestProblems(contestID)
	if err != nil {
		log.Printf("[ADMIN_CONTEST_PROBLEM] Failed to list contest problems: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list contest problems"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"contest_id": contestID,
		"items":      problems,
	})
}

// AdminGetContestProblem returns detailed information about a specific problem in a contest (Admin only)
func AdminGetContestProblem(c *gin.Context) {
	contestID := c.Query("contest_id")
	if contestID == "" {
		contestID = c.Param("contest_id")
	}
	problemID := c.Param("problem_id")
	if problemID == "" {
		problemID = c.Query("problem_id")
	}
	if contestID == "" || problemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_contest_id_or_problem_id"})
		return
	}

	log.Printf("[ADMIN_CONTEST_PROBLEM] AdminGetContestProblem: contestID=%s, problemID=%s", contestID, problemID)

	problem, err := repository.GetContestProblem(contestID, problemID)
	if err != nil {
		log.Printf("[ADMIN_CONTEST_PROBLEM] Failed to get contest problem: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest problem not found"})
		return
	}

	c.JSON(http.StatusOK, problem)
}

// AdminAddProblemToContest adds a problem to a contest (Admin only)
func AdminAddProblemToContest(c *gin.Context) {
	contestID := c.Query("contest_id")
	if contestID == "" {
		contestID = c.Param("contest_id")
	}
	if contestID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_contest_id"})
		return
	}

	userCtx, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, ok := userCtx.(middleware.UserContext)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid user context"})
		return
	}

	var req struct {
		ProblemID        string   `json:"problem_id" binding:"required"`
		Points           int      `json:"points" binding:"required,min=1"`
		Ordinal          *int     `json:"ordinal"`
		TimeLimitMs      *int     `json:"time_limit_ms"`
		MemoryLimitKb    *int     `json:"memory_limit_kb"`
		AllowedLanguages []string `json:"allowed_languages"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[ADMIN_CONTEST_PROBLEM] AdminAddProblemToContest: contestID=%s, problemID=%s, userID=%s", contestID, req.ProblemID, user.ID)

	contestProblem := &models.ContestProblem{
		ContestID:        contestID,
		ProblemID:        req.ProblemID,
		Points:           req.Points,
		Ordinal:          req.Ordinal,
		TimeLimitMs:      req.TimeLimitMs,
		MemoryLimitKb:    req.MemoryLimitKb,
		AllowedLanguages: req.AllowedLanguages,
	}

	if err := repository.AddProblemToContest(contestProblem); err != nil {
		log.Printf("[ADMIN_CONTEST_PROBLEM] Failed to add problem to contest: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add problem to contest"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"contest_id": contestID,
		"problem_id": req.ProblemID,
		"points":     req.Points,
		"ordinal":    req.Ordinal,
	})
}

// AdminUpdateContestProblem updates a problem's settings within a contest (Admin only)
func AdminUpdateContestProblem(c *gin.Context) {
	contestID := c.Query("contest_id")
	if contestID == "" {
		contestID = c.Param("contest_id")
	}
	problemID := c.Param("problem_id")
	if contestID == "" || problemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_contest_id_or_problem_id"})
		return
	}

	userCtx, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, ok := userCtx.(middleware.UserContext)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid user context"})
		return
	}

	var req struct {
		Points           *int      `json:"points"`
		Ordinal          *int      `json:"ordinal"`
		TimeLimitMs      *int      `json:"time_limit_ms"`
		MemoryLimitKb    *int      `json:"memory_limit_kb"`
		AllowedLanguages []string  `json:"allowed_languages"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[ADMIN_CONTEST_PROBLEM] AdminUpdateContestProblem: contestID=%s, problemID=%s, userID=%s", contestID, problemID, user.ID)

	updates := make(map[string]interface{})
	if req.Points != nil {
		updates["points"] = *req.Points
	}
	if req.Ordinal != nil {
		updates["ordinal"] = *req.Ordinal
	}
	if req.TimeLimitMs != nil {
		updates["time_limit_ms"] = *req.TimeLimitMs
	}
	if req.MemoryLimitKb != nil {
		updates["memory_limit_kb"] = *req.MemoryLimitKb
	}
	if req.AllowedLanguages != nil {
		updates["allowed_languages"] = req.AllowedLanguages
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	if err := repository.UpdateContestProblem(contestID, problemID, updates); err != nil {
		log.Printf("[ADMIN_CONTEST_PROBLEM] Failed to update contest problem: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update contest problem"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Contest problem updated successfully",
		"contest_id": contestID,
		"problem_id": problemID,
	})
}

// AdminRemoveProblemFromContest removes a problem from a contest (Admin only)
func AdminRemoveProblemFromContest(c *gin.Context) {
	contestID := c.Query("contest_id")
	if contestID == "" {
		contestID = c.Param("contest_id")
	}
	problemID := c.Param("problem_id")
	if contestID == "" || problemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_contest_id_or_problem_id"})
		return
	}

	userCtx, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, ok := userCtx.(middleware.UserContext)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid user context"})
		return
	}

	log.Printf("[ADMIN_CONTEST_PROBLEM] AdminRemoveProblemFromContest: contestID=%s, problemID=%s, userID=%s", contestID, problemID, user.ID)

	if err := repository.RemoveProblemFromContest(contestID, problemID); err != nil {
		log.Printf("[ADMIN_CONTEST_PROBLEM] Failed to remove problem from contest: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove problem from contest"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Problem removed from contest successfully",
		"contest_id": contestID,
		"problem_id": problemID,
	})
}

// AdminMakeContestProblemPublic makes a contest problem public (Admin only)
func AdminMakeContestProblemPublic(c *gin.Context) {
	var req struct {
		ContestID string `json:"contest_id" binding:"required"`
		ProblemID string `json:"problem_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	contestID := req.ContestID
	problemID := req.ProblemID

	userCtx, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, ok := userCtx.(middleware.UserContext)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid user context"})
		return
	}

	// Check if user is admin
	if !constants.HasAnyRole(user.Roles, constants.AdminRoles) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only admins can make problems public"})
		return
	}

	log.Printf("[ADMIN_CONTEST_PROBLEM] AdminMakeContestProblemPublic: contestID=%s, problemID=%s, userID=%s", contestID, problemID, user.ID)

	// Verify contest problem exists
	_, err := repository.GetContestProblem(contestID, problemID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest problem not found"})
		return
	}

	// Update the problem to make it public
	updates := map[string]interface{}{
		"is_public": true,
	}
	if err := repository.UpdateProblemByID(problemID, updates); err != nil {
		log.Printf("[ADMIN_CONTEST_PROBLEM] Failed to make problem public: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to make problem public"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Problem made public successfully",
		"contest_id": contestID,
		"problem_id": problemID,
	})
}

// AdminAddProblemFromPublic adds a public problem to a contest (Admin only)
func AdminAddProblemFromPublic(c *gin.Context) {
	var req struct {
		ContestID        string   `json:"contest_id" binding:"required"`
		ProblemID        string   `json:"problem_id" binding:"required"`
		Points           int      `json:"points" binding:"required,min=1"`
		Ordinal          *int     `json:"ordinal"`
		TimeLimitMs      *int     `json:"time_limit_ms"`
		MemoryLimitKb    *int     `json:"memory_limit_kb"`
		AllowedLanguages []string  `json:"allowed_languages"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	contestID := req.ContestID

	userCtx, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, ok := userCtx.(middleware.UserContext)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid user context"})
		return
	}

	log.Printf("[ADMIN_CONTEST_PROBLEM] AdminAddProblemFromPublic: contestID=%s, problemID=%s, userID=%s", contestID, req.ProblemID, user.ID)

	// Verify problem exists and is public
	problem, err := repository.GetProblem(req.ProblemID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Problem not found"})
		return
	}

	if !problem.IsPublic {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Problem is not public"})
		return
	}

	// Add problem to contest
	contestProblem := &models.ContestProblem{
		ContestID:        contestID,
		ProblemID:        req.ProblemID,
		Points:           req.Points,
		Ordinal:          req.Ordinal,
		TimeLimitMs:      req.TimeLimitMs,
		MemoryLimitKb:    req.MemoryLimitKb,
		AllowedLanguages: req.AllowedLanguages,
	}

	if err := repository.AddProblemToContest(contestProblem); err != nil {
		log.Printf("[ADMIN_CONTEST_PROBLEM] Failed to add problem to contest: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add problem to contest"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Problem added to contest successfully",
		"contest_id": contestID,
		"problem_id": req.ProblemID,
		"points":     req.Points,
		"ordinal":    req.Ordinal,
	})
}

