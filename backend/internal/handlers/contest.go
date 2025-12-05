package handlers

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"codehustle/backend/internal/constants"
	"codehustle/backend/internal/middleware"
	"codehustle/backend/internal/models"
	"codehustle/backend/internal/repository"
)

// Helper function to get primary role from user context (uses highest privilege role)
func getPrimaryRole(roles []string) string {
	if constants.HasRole(roles, constants.RoleAdmin) {
		return constants.RoleAdmin
	}
	if constants.HasRole(roles, constants.RoleInstructor) {
		return constants.RoleInstructor
	}
	if constants.HasRole(roles, constants.RoleTA) {
		return constants.RoleTA
	}
	if constants.HasRole(roles, constants.RoleStudent) {
		return constants.RoleStudent
	}
	return ""
}

// ListContests returns a paginated list of contests
func ListContests(c *gin.Context) {
	// Get pagination and filter parameters
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "50")
	query := c.Query("q")
	statusFilter := c.Query("status") // upcoming, running, ended
	isPublicStr := c.Query("is_public")

	pageNum, err := strconv.Atoi(page)
	if err != nil || pageNum < 1 {
		pageNum = 1
	}

	pageSizeNum, err := strconv.Atoi(pageSize)
	if err != nil || pageSizeNum < 1 {
		pageSizeNum = 50
	}
	if pageSizeNum > 100 {
		pageSizeNum = 100
	}

	var isPublic *bool
	if isPublicStr != "" {
		val := isPublicStr == "true"
		isPublic = &val
	}

	// Get user context
	userID := ""
	userRole := ""
	userCtx, exists := c.Get("user")
	if exists {
		if userCtxVal, ok := userCtx.(middleware.UserContext); ok {
			userID = userCtxVal.ID
			userRole = getPrimaryRole(userCtxVal.Roles)
		}
	}

	log.Printf("[CONTEST] ListContests: page=%d, pageSize=%d, query=%s, status=%s, isPublic=%v, userRole=%s",
		pageNum, pageSizeNum, query, statusFilter, isPublic, userRole)

	result, err := repository.ListContests(userID, userRole, pageNum, pageSizeNum, query, statusFilter, isPublic)
	if err != nil {
		log.Printf("[CONTEST] Failed to list contests: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list contests"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetContest returns detailed information about a specific contest
func GetContest(c *gin.Context) {
	contestID := c.Param("id")

	// Get user context
	userID := ""
	userRole := ""
	userCtx, exists := c.Get("user")
	if exists {
		if userCtxVal, ok := userCtx.(middleware.UserContext); ok {
			userID = userCtxVal.ID
			userRole = getPrimaryRole(userCtxVal.Roles)
		}
	}

	log.Printf("[CONTEST] GetContest: contestID=%s, userID=%s, userRole=%s", contestID, userID, userRole)

	contest, isRegistered, err := repository.GetContest(contestID, userID, userRole)
	if err != nil {
		log.Printf("[CONTEST] Failed to get contest: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	response := gin.H{
		"id":                          contest.ID,
		"title":                       contest.Title,
		"description":                 contest.Description,
		"start_at":                    contest.StartAt,
		"end_at":                      contest.EndAt,
		"is_public":                   contest.IsPublic,
		"allowed_languages":           contest.AllowedLanguages,
		"submission_limit_per_problem": contest.SubmissionLimitPerProblem,
		"rule_type":                   contest.RuleType,
		"status":                      contest.Status(),
		"created_by":                  contest.CreatedBy,
		"created_at":                  contest.CreatedAt,
		"updated_at":                  contest.UpdatedAt,
		"requires_password":           contest.RequiresPassword(),
		"is_registered":               isRegistered,
	}

	c.JSON(http.StatusOK, response)
}

// CreateContest creates a new contest (Admin/Lecturer only)
func CreateContest(c *gin.Context) {
	userCtx, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, ok := userCtx.(middleware.UserContext)
	if !ok || !constants.HasRole(user.Roles, constants.RoleAdmin, constants.RoleInstructor) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only admins and instructors can create contests"})
		return
	}

	var req struct {
		Title                    string   `json:"title" binding:"required"`
		Description              string   `json:"description"`
		StartAt                  string   `json:"start_at" binding:"required"`
		EndAt                    string   `json:"end_at" binding:"required"`
		IsPublic                 bool     `json:"is_public"`
		Password                 *string  `json:"password"`
		AllowedLanguages         []string `json:"allowed_languages"`
		SubmissionLimitPerProblem int     `json:"submission_limit_per_problem"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse times
	startAt, err := time.Parse(time.RFC3339, req.StartAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_at format"})
		return
	}

	endAt, err := time.Parse(time.RFC3339, req.EndAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_at format"})
		return
	}

	if endAt.Before(startAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end_at must be after start_at"})
		return
	}

	// Hash password if provided
	var hashedPassword *string
	if req.Password != nil && *req.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("[CONTEST] Failed to hash password: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
			return
		}
		hashed := string(hash)
		hashedPassword = &hashed
	}

	contest := &models.Contest{
		ID:                       uuid.New().String(),
		Title:                    req.Title,
		Description:              req.Description,
		StartAt:                  startAt,
		EndAt:                    endAt,
		IsPublic:                 req.IsPublic,
		Password:                 hashedPassword,
		AllowedLanguages:         req.AllowedLanguages,
		SubmissionLimitPerProblem: req.SubmissionLimitPerProblem,
		RuleType:                 "OI",
		CreatedBy:                user.ID,
	}

	log.Printf("[CONTEST] CreateContest: userID=%s, title=%s", user.ID, req.Title)

	if err := repository.CreateContest(contest); err != nil {
		log.Printf("[CONTEST] Failed to create contest: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create contest"})
		return
	}

	response := gin.H{
		"id":                          contest.ID,
		"title":                       contest.Title,
		"description":                 contest.Description,
		"start_at":                    contest.StartAt,
		"end_at":                      contest.EndAt,
		"is_public":                   contest.IsPublic,
		"allowed_languages":           contest.AllowedLanguages,
		"submission_limit_per_problem": contest.SubmissionLimitPerProblem,
		"rule_type":                   contest.RuleType,
		"created_by":                  contest.CreatedBy,
		"created_at":                  contest.CreatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// UpdateContest updates an existing contest (Admin/Creator only)
func UpdateContest(c *gin.Context) {
	contestID := c.Param("id")

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
		Title                    *string  `json:"title"`
		Description              *string  `json:"description"`
		StartAt                  *string  `json:"start_at"`
		EndAt                    *string  `json:"end_at"`
		IsPublic                 *bool    `json:"is_public"`
		Password                 *string  `json:"password"`
		AllowedLanguages         []string `json:"allowed_languages"`
		SubmissionLimitPerProblem *int    `json:"submission_limit_per_problem"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[CONTEST] UpdateContest: contestID=%s, userID=%s", contestID, user.ID)

	userRole := getPrimaryRole(user.Roles)

	// Check authorization
	contest, _, err := repository.GetContest(contestID, user.ID, userRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	if !constants.HasRole(user.Roles, constants.RoleAdmin) && contest.CreatedBy != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only contest creator or admin can update"})
		return
	}

	// Apply updates
	if req.Title != nil {
		contest.Title = *req.Title
	}
	if req.Description != nil {
		contest.Description = *req.Description
	}
	if req.StartAt != nil {
		startAt, err := time.Parse(time.RFC3339, *req.StartAt)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_at format"})
			return
		}
		contest.StartAt = startAt
	}
	if req.EndAt != nil {
		endAt, err := time.Parse(time.RFC3339, *req.EndAt)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_at format"})
			return
		}
		contest.EndAt = endAt
	}
	if req.IsPublic != nil {
		contest.IsPublic = *req.IsPublic
	}
	if req.Password != nil {
		if *req.Password == "" {
			contest.Password = nil
		} else {
			hash, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
			if err != nil {
				log.Printf("[CONTEST] Failed to hash password: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
				return
			}
			hashed := string(hash)
			contest.Password = &hashed
		}
	}
	if req.AllowedLanguages != nil {
		contest.AllowedLanguages = req.AllowedLanguages
	}
	if req.SubmissionLimitPerProblem != nil {
		contest.SubmissionLimitPerProblem = *req.SubmissionLimitPerProblem
	}

	if contest.EndAt.Before(contest.StartAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end_at must be after start_at"})
		return
	}

	now := time.Now()
	contest.UpdatedAt = &now

	if err := repository.UpdateContest(contest); err != nil {
		log.Printf("[CONTEST] Failed to update contest: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update contest"})
		return
	}

	response := gin.H{
		"id":                          contest.ID,
		"title":                       contest.Title,
		"description":                 contest.Description,
		"start_at":                    contest.StartAt,
		"end_at":                      contest.EndAt,
		"is_public":                   contest.IsPublic,
		"allowed_languages":           contest.AllowedLanguages,
		"submission_limit_per_problem": contest.SubmissionLimitPerProblem,
		"rule_type":                   contest.RuleType,
		"updated_at":                  contest.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteContest soft deletes a contest (Admin/Creator only)
func DeleteContest(c *gin.Context) {
	contestID := c.Param("id")

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

	log.Printf("[CONTEST] DeleteContest: contestID=%s, userID=%s", contestID, user.ID)

	userRole := getPrimaryRole(user.Roles)

	// Check authorization
	contest, _, err := repository.GetContest(contestID, user.ID, userRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	if !constants.HasRole(user.Roles, constants.RoleAdmin) && contest.CreatedBy != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only contest creator or admin can delete"})
		return
	}

	if err := repository.DeleteContest(contestID); err != nil {
		log.Printf("[CONTEST] Failed to delete contest: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete contest"})
		return
	}

	c.Status(http.StatusNoContent)
}

// RegisterForContest registers the current user for a contest
func RegisterForContest(c *gin.Context) {
	contestID := c.Param("id")

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
		Password *string `json:"password"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[CONTEST] RegisterForContest: contestID=%s, userID=%s", contestID, user.ID)

	userRole := getPrimaryRole(user.Roles)

	// Get contest
	contest, isRegistered, err := repository.GetContest(contestID, user.ID, userRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	if isRegistered {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already registered for this contest"})
		return
	}

	if !contest.CanRegister() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Contest registration is closed"})
		return
	}

	// Check password if required
	if contest.RequiresPassword() {
		if req.Password == nil || *req.Password == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password is required"})
			return
		}

		err := bcrypt.CompareHashAndPassword([]byte(*contest.Password), []byte(*req.Password))
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid password"})
			return
		}
	}

	participant := &models.ContestParticipant{
		ContestID: contestID,
		UserID:    user.ID,
	}

	if err := repository.RegisterForContest(participant); err != nil {
		log.Printf("[CONTEST] Failed to register for contest: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register for contest"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Successfully registered for contest",
		"contest_id":  contestID,
		"user_id":     user.ID,
		"registered_at": time.Now(),
	})
}

// VerifyContestPassword verifies the password for a contest without registering
func VerifyContestPassword(c *gin.Context) {
	contestID := c.Param("id")

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
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[CONTEST] VerifyContestPassword: contestID=%s, userID=%s", contestID, user.ID)

	userRole := getPrimaryRole(user.Roles)

	// Get contest
	contest, _, err := repository.GetContest(contestID, user.ID, userRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	// Check if contest requires password
	if !contest.RequiresPassword() {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "contest_does_not_require_password",
			"message": "This contest does not require a password",
		})
		return
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(*contest.Password), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "invalid_password",
			"message": "Invalid password",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "Password verified successfully",
		"contest_id": contestID,
	})
}

// UnregisterFromContest removes the current user's registration from a contest
func UnregisterFromContest(c *gin.Context) {
	contestID := c.Param("id")

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

	log.Printf("[CONTEST] UnregisterFromContest: contestID=%s, userID=%s", contestID, user.ID)

	userRole := getPrimaryRole(user.Roles)

	// Get contest
	contest, isRegistered, err := repository.GetContest(contestID, user.ID, userRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	if !isRegistered {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Not registered for this contest"})
		return
	}

	// Don't allow unregistration once contest has started
	if contest.IsActive() || contest.Status() == "ended" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot unregister from a running or ended contest"})
		return
	}

	if err := repository.UnregisterFromContest(contestID, user.ID); err != nil {
		log.Printf("[CONTEST] Failed to unregister from contest: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unregister from contest"})
		return
	}

	c.Status(http.StatusNoContent)
}

// ListContestParticipants returns the list of participants for a contest
func ListContestParticipants(c *gin.Context) {
	contestID := c.Param("id")

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

	log.Printf("[CONTEST] ListContestParticipants: contestID=%s, userID=%s", contestID, user.ID)

	userRole := getPrimaryRole(user.Roles)

	// Check if contest exists and user has access
	contest, isRegistered, err := repository.GetContest(contestID, user.ID, userRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	// Only admins, creators, or registered participants can view participant list
	canViewAll := constants.HasRole(user.Roles, constants.RoleAdmin) || contest.CreatedBy == user.ID
	if !canViewAll && !isRegistered {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	participants, count, err := repository.ListContestParticipants(contestID, canViewAll, user.ID)
	if err != nil {
		log.Printf("[CONTEST] Failed to list participants: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list participants"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"contest_id": contestID,
		"total":      count,
		"participants": participants,
	})
}

// ListContestProblems returns the problems for a contest
func ListContestProblems(c *gin.Context) {
	contestID := c.Param("id")

	userCtx, exists := c.Get("user")
	userID := ""
	userRole := ""
	if exists {
		if user, ok := userCtx.(middleware.UserContext); ok {
			userID = user.ID
			userRole = getPrimaryRole(user.Roles)
		}
	}

	log.Printf("[CONTEST] ListContestProblems: contestID=%s, userID=%s", contestID, userID)

	// Check if contest exists and user has access
	contest, isRegistered, err := repository.GetContest(contestID, userID, userRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	// Check access: must be public, or user must be registered/admin/creator
	canAccess := contest.IsPublic ||
		isRegistered ||
		userRole == constants.RoleAdmin ||
		contest.CreatedBy == userID

	if !canAccess {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// If contest hasn't started, only admin/creator can see problems
	if contest.Status() == "upcoming" && userRole != constants.RoleAdmin && contest.CreatedBy != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Contest has not started yet"})
		return
	}

	problems, err := repository.ListContestProblems(contestID)
	if err != nil {
		log.Printf("[CONTEST] Failed to list contest problems: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list contest problems"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"contest_id": contestID,
		"items":      problems,
	})
}

// GetContestProblem returns detailed information about a specific problem in a contest
func GetContestProblem(c *gin.Context) {
	contestID := c.Param("id")
	problemID := c.Param("problem_id")

	userCtx, exists := c.Get("user")
	userID := ""
	userRole := ""
	if exists {
		if user, ok := userCtx.(middleware.UserContext); ok {
			userID = user.ID
			userRole = getPrimaryRole(user.Roles)
		}
	}

	log.Printf("[CONTEST] GetContestProblem: contestID=%s, problemID=%s, userID=%s", contestID, problemID, userID)

	// Check contest access
	contest, isRegistered, err := repository.GetContest(contestID, userID, userRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	canAccess := contest.IsPublic ||
		isRegistered ||
		userRole == constants.RoleAdmin ||
		contest.CreatedBy == userID

	if !canAccess {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	if contest.Status() == "upcoming" && userRole != constants.RoleAdmin && contest.CreatedBy != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Contest has not started yet"})
		return
	}

	problem, err := repository.GetContestProblem(contestID, problemID)
	if err != nil {
		log.Printf("[CONTEST] Failed to get contest problem: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Problem not found in this contest"})
		return
	}

	c.JSON(http.StatusOK, problem)
}

// AddProblemToContest adds a problem to a contest (Admin/Creator only)
func AddProblemToContest(c *gin.Context) {
	contestID := c.Param("id")

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

	log.Printf("[CONTEST] AddProblemToContest: contestID=%s, problemID=%s, userID=%s", contestID, req.ProblemID, user.ID)

	userRole := getPrimaryRole(user.Roles)

	// Check authorization
	contest, _, err := repository.GetContest(contestID, user.ID, userRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	if !constants.HasRole(user.Roles, constants.RoleAdmin) && contest.CreatedBy != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only contest creator or admin can add problems"})
		return
	}

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
		log.Printf("[CONTEST] Failed to add problem to contest: %v", err)
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

// UpdateContestProblem updates a problem's settings within a contest (Admin/Creator only)
func UpdateContestProblem(c *gin.Context) {
	contestID := c.Param("id")
	problemID := c.Param("problem_id")

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
		Points           *int     `json:"points"`
		Ordinal          *int     `json:"ordinal"`
		TimeLimitMs      *int     `json:"time_limit_ms"`
		MemoryLimitKb    *int     `json:"memory_limit_kb"`
		AllowedLanguages []string `json:"allowed_languages"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[CONTEST] UpdateContestProblem: contestID=%s, problemID=%s, userID=%s", contestID, problemID, user.ID)

	userRole := getPrimaryRole(user.Roles)

	// Check authorization
	contest, _, err := repository.GetContest(contestID, user.ID, userRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	if !constants.HasRole(user.Roles, constants.RoleAdmin) && contest.CreatedBy != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only contest creator or admin can update problems"})
		return
	}

	updates := map[string]interface{}{}
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

	if err := repository.UpdateContestProblem(contestID, problemID, updates); err != nil {
		log.Printf("[CONTEST] Failed to update contest problem: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update contest problem"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Contest problem updated successfully",
		"contest_id": contestID,
		"problem_id": problemID,
	})
}

// RemoveProblemFromContest removes a problem from a contest (Admin/Creator only)
func RemoveProblemFromContest(c *gin.Context) {
	contestID := c.Param("id")
	problemID := c.Param("problem_id")

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

	log.Printf("[CONTEST] RemoveProblemFromContest: contestID=%s, problemID=%s, userID=%s", contestID, problemID, user.ID)

	userRole := getPrimaryRole(user.Roles)

	// Check authorization
	contest, _, err := repository.GetContest(contestID, user.ID, userRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	if !constants.HasRole(user.Roles, constants.RoleAdmin) && contest.CreatedBy != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only contest creator or admin can remove problems"})
		return
	}

	if err := repository.RemoveProblemFromContest(contestID, problemID); err != nil {
		log.Printf("[CONTEST] Failed to remove problem from contest: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove problem from contest"})
		return
	}

	c.Status(http.StatusNoContent)
}

// SubmitContestProblem handles code submission for a contest problem
func SubmitContestProblem(c *gin.Context) {
	contestID := c.Param("id")
	problemID := c.Param("problem_id")

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
		Language        string `json:"language" binding:"required"`
		SourceCode      string `json:"source_code" binding:"required"`
		LanguageVersion string `json:"language_version"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[CONTEST] SubmitContestProblem: contestID=%s, problemID=%s, userID=%s, language=%s",
		contestID, problemID, user.ID, req.Language)

	userRole := getPrimaryRole(user.Roles)

	// Check contest access and status
	contest, isRegistered, err := repository.GetContest(contestID, user.ID, userRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	// Must be registered (unless admin)
	if !isRegistered && !constants.HasRole(user.Roles, constants.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Must be registered for contest to submit"})
		return
	}

	// Contest must be running
	if !contest.IsActive() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Contest is not currently running"})
		return
	}

	// Get contest problem details
	contestProblem, err := repository.GetContestProblem(contestID, problemID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Problem not found in this contest"})
		return
	}

	// Check language is allowed
	allowedLanguages := contestProblem.AllowedLanguages
	if len(allowedLanguages) == 0 {
		allowedLanguages = contest.AllowedLanguages
	}

	if len(allowedLanguages) > 0 {
		languageAllowed := false
		for _, lang := range allowedLanguages {
			if lang == req.Language {
				languageAllowed = true
				break
			}
		}
		if !languageAllowed {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":             "Language not allowed for this contest",
				"allowed_languages": allowedLanguages,
			})
			return
		}
	}

	// Check submission limit
	if contest.SubmissionLimitPerProblem > 0 {
		count, err := repository.GetContestSubmissionCount(contestID, problemID, user.ID)
		if err != nil {
			log.Printf("[CONTEST] Failed to get submission count: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check submission limit"})
			return
		}

		if count >= int64(contest.SubmissionLimitPerProblem) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Submission limit reached for this problem",
				"limit": contest.SubmissionLimitPerProblem,
			})
			return
		}
	}

	// Create submission (this would integrate with your existing submission system)
	submissionID := uuid.New().String()

	// Note: This is a simplified version. In production, you would:
	// 1. Store the code in MinIO or another storage
	// 2. Create a submission record in the database
	// 3. Queue the submission for judging
	// For now, we'll return a placeholder response

	c.JSON(http.StatusCreated, gin.H{
		"id":           submissionID,
		"contest_id":   contestID,
		"problem_id":   problemID,
		"status":       "pending",
		"submitted_at": time.Now(),
		"message":      "Submission received and will be judged shortly",
	})
}

// ListContestSubmissions returns submissions for a contest
func ListContestSubmissions(c *gin.Context) {
	contestID := c.Param("id")

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

	// Get filter parameters
	problemIDFilter := c.Query("problem_id")
	userIDFilter := c.Query("user_id")
	statusFilter := c.Query("status")

	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "50")

	pageNum, err := strconv.Atoi(page)
	if err != nil || pageNum < 1 {
		pageNum = 1
	}

	pageSizeNum, err := strconv.Atoi(pageSize)
	if err != nil || pageSizeNum < 1 {
		pageSizeNum = 50
	}
	if pageSizeNum > 100 {
		pageSizeNum = 100
	}

	log.Printf("[CONTEST] ListContestSubmissions: contestID=%s, userID=%s, filters={problem:%s, user:%s, status:%s}",
		contestID, user.ID, problemIDFilter, userIDFilter, statusFilter)

	userRole := getPrimaryRole(user.Roles)

	// Check contest access
	contest, isRegistered, err := repository.GetContest(contestID, user.ID, userRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	// Determine permissions
	canViewAll := constants.HasRole(user.Roles, constants.RoleAdmin) || contest.CreatedBy == user.ID
	viewUserID := user.ID

	if canViewAll && userIDFilter != "" {
		// Admin/creator can filter by specific user
		viewUserID = userIDFilter
	} else if !canViewAll {
		// Regular users can only see their own submissions
		viewUserID = user.ID
	}

	if !canViewAll && !isRegistered {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	result, err := repository.ListContestSubmissions(contestID, viewUserID, problemIDFilter, statusFilter, pageNum, pageSizeNum)
	if err != nil {
		log.Printf("[CONTEST] Failed to list contest submissions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list submissions"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetContestSubmission returns a specific submission within a contest
func GetContestSubmission(c *gin.Context) {
	contestID := c.Param("id")
	submissionID := c.Param("submission_id")

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

	log.Printf("[CONTEST] GetContestSubmission: contestID=%s, submissionID=%s, userID=%s", contestID, submissionID, user.ID)

	userRole := getPrimaryRole(user.Roles)

	// Check contest access
	contest, _, err := repository.GetContest(contestID, user.ID, userRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	submission, err := repository.GetSubmissionByID(submissionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Submission not found"})
		return
	}

	// Verify submission belongs to this contest
	if submission.ContestID == nil || *submission.ContestID != contestID {
		c.JSON(http.StatusNotFound, gin.H{"error": "Submission not found in this contest"})
		return
	}

	// Check permissions: user can see their own, admin/creator can see all
	canView := constants.HasRole(user.Roles, constants.RoleAdmin) ||
		contest.CreatedBy == user.ID ||
		submission.UserID == user.ID

	if !canView {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, submission)
}

// ListContestProblemSubmissions returns submissions for a specific problem in a contest
func ListContestProblemSubmissions(c *gin.Context) {
	contestID := c.Param("id")
	problemID := c.Param("problem_id")

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

	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "50")

	pageNum, err := strconv.Atoi(page)
	if err != nil || pageNum < 1 {
		pageNum = 1
	}

	pageSizeNum, err := strconv.Atoi(pageSize)
	if err != nil || pageSizeNum < 1 {
		pageSizeNum = 50
	}
	if pageSizeNum > 100 {
		pageSizeNum = 100
	}

	log.Printf("[CONTEST] ListContestProblemSubmissions: contestID=%s, problemID=%s, userID=%s", contestID, problemID, user.ID)

	userRole := getPrimaryRole(user.Roles)

	// Check contest access
	contest, isRegistered, err := repository.GetContest(contestID, user.ID, userRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	canViewAll := constants.HasRole(user.Roles, constants.RoleAdmin) || contest.CreatedBy == user.ID
	viewUserID := user.ID

	if !canViewAll && !isRegistered {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	result, err := repository.ListContestSubmissions(contestID, viewUserID, problemID, "", pageNum, pageSizeNum)
	if err != nil {
		log.Printf("[CONTEST] Failed to list problem submissions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list submissions"})
		return
	}

	c.JSON(http.StatusOK, result)
}

