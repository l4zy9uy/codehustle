package repository

import (
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"

	"codehustle/backend/internal/constants"
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/models"
)

// Helper function to get database connection
func getDB() *gorm.DB {
	return db.DB
}

// ListContestsResponse represents a paginated list of contests
type ListContestsResponse struct {
	Contests []ContestListItem `json:"contests"`
	Total    int64             `json:"total"`
	Page     int               `json:"page"`
	PageSize int               `json:"page_size"`
}

// ContestListItem represents a single contest in the list
type ContestListItem struct {
	ID               string    `json:"id"`
	Title            string    `json:"title"`
	StartAt          time.Time `json:"start_at"`
	EndAt            time.Time `json:"end_at"`
	IsPublic         bool      `json:"is_public"`
	Status           string    `json:"status"`
	ParticipantCount int64     `json:"participant_count"`
	ProblemCount     int64     `json:"problem_count"`
	RuleType         string    `json:"rule_type"`
	RequiresPassword bool      `json:"requires_password"`
	IsRegistered     bool      `json:"is_registered,omitempty"`
}

// ListContests returns paginated contests
func ListContests(userID, userRole string, page, pageSize int, query, statusFilter string, isPublic *bool) (*ListContestsResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 50
	}
	if pageSize > 100 {
		pageSize = 100
	}

	offset := (page - 1) * pageSize
	dbConn := getDB()

	// Build base query
	baseQuery := dbConn.Model(&models.Contest{}).Where("deleted_at IS NULL")

	// Apply filters
	if query != "" {
		searchPattern := "%" + query + "%"
		baseQuery = baseQuery.Where("title LIKE ? OR description LIKE ?", searchPattern, searchPattern)
	}

	if isPublic != nil {
		baseQuery = baseQuery.Where("is_public = ?", *isPublic)
	}

	// Status filter
	now := time.Now()
	switch statusFilter {
	case "upcoming":
		baseQuery = baseQuery.Where("start_at > ?", now)
	case "running":
		baseQuery = baseQuery.Where("start_at <= ? AND end_at > ?", now, now)
	case "ended":
		baseQuery = baseQuery.Where("end_at <= ?", now)
	}

	// Non-admin users only see public contests or contests they created
	if userRole != constants.RoleAdmin {
		baseQuery = baseQuery.Where("is_public = ? OR created_by = ?", true, userID)
	}

	// Count total
	var total int64
	if err := baseQuery.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count contests: %w", err)
	}

	// Fetch contests
	var contests []models.Contest
	if err := baseQuery.Order("start_at DESC").
		Limit(pageSize).
		Offset(offset).
		Find(&contests).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch contests: %w", err)
	}

	// Get contest IDs for batch queries
	contestIDs := make([]string, len(contests))
	for i, c := range contests {
		contestIDs[i] = c.ID
	}

	// Get participant counts
	participantCounts := make(map[string]int64)
	if len(contestIDs) > 0 {
		var counts []struct {
			ContestID string
			Count     int64
		}
		dbConn.Model(&models.ContestParticipant{}).
			Select("contest_id, COUNT(*) as count").
			Where("contest_id IN ?", contestIDs).
			Group("contest_id").
			Scan(&counts)

		for _, c := range counts {
			participantCounts[c.ContestID] = c.Count
		}
	}

	// Get problem counts
	problemCounts := make(map[string]int64)
	if len(contestIDs) > 0 {
		var counts []struct {
			ContestID string
			Count     int64
		}
		dbConn.Model(&models.ContestProblem{}).
			Select("contest_id, COUNT(*) as count").
			Where("contest_id IN ?", contestIDs).
			Group("contest_id").
			Scan(&counts)

		for _, c := range counts {
			problemCounts[c.ContestID] = c.Count
		}
	}

	// Check user registration status
	registeredContests := make(map[string]bool)
	if userID != "" && len(contestIDs) > 0 {
		var participants []models.ContestParticipant
		dbConn.Where("user_id = ? AND contest_id IN ?", userID, contestIDs).
			Find(&participants)

		for _, p := range participants {
			registeredContests[p.ContestID] = true
		}
	}

	// Build response
	items := make([]ContestListItem, len(contests))
	for i, contest := range contests {
		items[i] = ContestListItem{
			ID:               contest.ID,
			Title:            contest.Title,
			StartAt:          contest.StartAt,
			EndAt:            contest.EndAt,
			IsPublic:         contest.IsPublic,
			Status:           contest.Status(),
			ParticipantCount: participantCounts[contest.ID],
			ProblemCount:     problemCounts[contest.ID],
			RuleType:         contest.RuleType,
			RequiresPassword: contest.RequiresPassword(),
			IsRegistered:     registeredContests[contest.ID],
		}
	}

	return &ListContestsResponse{
		Contests: items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

// GetContest returns a contest by ID
func GetContest(contestID, userID, userRole string) (*models.Contest, bool, error) {
	dbConn := getDB()

	var contest models.Contest
	if err := dbConn.Where("id = ? AND deleted_at IS NULL", contestID).First(&contest).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, false, fmt.Errorf("contest not found")
		}
		return nil, false, fmt.Errorf("failed to fetch contest: %w", err)
	}

	// Check if user is registered
	isRegistered := false
	if userID != "" {
		var count int64
		dbConn.Model(&models.ContestParticipant{}).
			Where("contest_id = ? AND user_id = ?", contestID, userID).
			Count(&count)
		isRegistered = count > 0
	}

	// Non-admin users can only see public contests or contests they created
	if userRole != constants.RoleAdmin && !contest.IsPublic && contest.CreatedBy != userID {
		return nil, false, fmt.Errorf("access denied")
	}

	return &contest, isRegistered, nil
}

// CheckContestAccess checks if a user has access to a contest and returns detailed access information
func CheckContestAccess(contestID, userID, userRole string) (*models.Contest, bool, bool, error) {
	dbConn := getDB()

	var contest models.Contest
	if err := dbConn.Where("id = ? AND deleted_at IS NULL", contestID).First(&contest).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, false, false, fmt.Errorf("contest not found")
		}
		return nil, false, false, fmt.Errorf("failed to fetch contest: %w", err)
	}

	// Check if user is registered
	isRegistered := false
	if userID != "" {
		var count int64
		dbConn.Model(&models.ContestParticipant{}).
			Where("contest_id = ? AND user_id = ?", contestID, userID).
			Count(&count)
		isRegistered = count > 0
	}

	// Check access: must be public, or user must be registered/admin/creator
	canAccess := contest.IsPublic ||
		isRegistered ||
		userRole == constants.RoleAdmin ||
		contest.CreatedBy == userID

	return &contest, isRegistered, canAccess, nil
}

// CreateContest creates a new contest
func CreateContest(contest *models.Contest) error {
	dbConn := getDB()

	if err := dbConn.Create(contest).Error; err != nil {
		return fmt.Errorf("failed to create contest: %w", err)
	}

	log.Printf("[REPO] Contest created: %s", contest.ID)
	return nil
}

// UpdateContest updates an existing contest
func UpdateContest(contest *models.Contest) error {
	dbConn := getDB()

	if err := dbConn.Save(contest).Error; err != nil {
		return fmt.Errorf("failed to update contest: %w", err)
	}

	log.Printf("[REPO] Contest updated: %s", contest.ID)
	return nil
}

// DeleteContest soft deletes a contest
func DeleteContest(contestID string) error {
	dbConn := getDB()

	now := time.Now()
	if err := dbConn.Model(&models.Contest{}).
		Where("id = ?", contestID).
		Update("deleted_at", now).Error; err != nil {
		return fmt.Errorf("failed to delete contest: %w", err)
	}

	log.Printf("[REPO] Contest soft deleted: %s", contestID)
	return nil
}

// RegisterForContest registers a user for a contest
func RegisterForContest(participant *models.ContestParticipant) error {
	dbConn := getDB()

	if err := dbConn.Create(participant).Error; err != nil {
		return fmt.Errorf("failed to register for contest: %w", err)
	}

	log.Printf("[REPO] User %s registered for contest %s", participant.UserID, participant.ContestID)
	return nil
}

// UnregisterFromContest removes a user's registration from a contest
func UnregisterFromContest(contestID, userID string) error {
	dbConn := getDB()

	if err := dbConn.Where("contest_id = ? AND user_id = ?", contestID, userID).
		Delete(&models.ContestParticipant{}).Error; err != nil {
		return fmt.Errorf("failed to unregister from contest: %w", err)
	}

	log.Printf("[REPO] User %s unregistered from contest %s", userID, contestID)
	return nil
}

// ContestParticipantItem represents a participant with user details
type ContestParticipantItem struct {
	UserID       string    `json:"user_id"`
	Username     string    `json:"username"`
	Email        string    `json:"email,omitempty"`
	RegisteredAt time.Time `json:"registered_at"`
}

// ListContestParticipants returns the list of participants for a contest
func ListContestParticipants(contestID string, canViewAll bool, userID string) ([]ContestParticipantItem, int64, error) {
	dbConn := getDB()

	// Count participants
	var count int64
	if err := dbConn.Model(&models.ContestParticipant{}).
		Where("contest_id = ?", contestID).
		Count(&count).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count participants: %w", err)
	}

	var participants []ContestParticipantItem

	if canViewAll {
		// Admin/creator can see all participants
		if err := dbConn.Table("contest_participants").
			Select("contest_participants.user_id, users.name as username, users.email, contest_participants.registered_at").
			Joins("LEFT JOIN users ON contest_participants.user_id = users.id").
			Where("contest_participants.contest_id = ?", contestID).
			Order("contest_participants.registered_at DESC").
			Scan(&participants).Error; err != nil {
			return nil, 0, fmt.Errorf("failed to fetch participants: %w", err)
		}
	} else {
		// Regular users only see themselves
		if err := dbConn.Table("contest_participants").
			Select("contest_participants.user_id, users.name as username, contest_participants.registered_at").
			Joins("LEFT JOIN users ON contest_participants.user_id = users.id").
			Where("contest_participants.contest_id = ? AND contest_participants.user_id = ?", contestID, userID).
			Scan(&participants).Error; err != nil {
			return nil, 0, fmt.Errorf("failed to fetch participant info: %w", err)
		}
	}

	return participants, count, nil
}

// ContestProblemItem represents a problem within a contest
type ContestProblemItem struct {
	ProblemID        string   `json:"problem_id"`
	Title            string   `json:"title"`
	Difficulty       string   `json:"difficulty"`
	Points           int      `json:"points"`
	Ordinal          *int     `json:"ordinal,omitempty"`
	TimeLimitMs      int      `json:"time_limit_ms"`
	MemoryLimitKb    int      `json:"memory_limit_kb"`
	AllowedLanguages []string `json:"allowed_languages,omitempty"`
}

// ListContestProblems returns the problems for a contest
func ListContestProblems(contestID string) ([]ContestProblemItem, error) {
	dbConn := getDB()

	var problems []struct {
		models.ContestProblem
		Title         string `gorm:"column:title"`
		Difficulty    string `gorm:"column:difficulty"`
		TimeLimitMs   int    `gorm:"column:problem_time_limit_ms"`
		MemoryLimitKb int    `gorm:"column:problem_memory_limit_kb"`
	}

	if err := dbConn.Table("contest_problems").
		Select("contest_problems.*, problems.title, problems.difficulty, problems.time_limit_ms as problem_time_limit_ms, problems.memory_limit_kb as problem_memory_limit_kb").
		Joins("LEFT JOIN problems ON contest_problems.problem_id = problems.id").
		Where("contest_problems.contest_id = ? AND problems.deleted_at IS NULL", contestID).
		Order("contest_problems.ordinal ASC, contest_problems.created_at ASC").
		Scan(&problems).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch contest problems: %w", err)
	}

	items := make([]ContestProblemItem, len(problems))
	for i, p := range problems {
		// Use per-contest overrides if available, otherwise use problem defaults
		timeLimitMs := p.TimeLimitMs
		if p.ContestProblem.TimeLimitMs != nil {
			timeLimitMs = *p.ContestProblem.TimeLimitMs
		}

		memoryLimitKb := p.MemoryLimitKb
		if p.ContestProblem.MemoryLimitKb != nil {
			memoryLimitKb = *p.ContestProblem.MemoryLimitKb
		}

		items[i] = ContestProblemItem{
			ProblemID:        p.ProblemID,
			Title:            p.Title,
			Difficulty:       p.Difficulty,
			Points:           p.Points,
			Ordinal:          p.Ordinal,
			TimeLimitMs:      timeLimitMs,
			MemoryLimitKb:    memoryLimitKb,
			AllowedLanguages: p.ContestProblem.AllowedLanguages,
		}
	}

	return items, nil
}

// GetContestProblem returns a specific problem within a contest
func GetContestProblem(contestID, problemID string) (*ContestProblemItem, error) {
	dbConn := getDB()

	var problem struct {
		models.ContestProblem
		Title         string `gorm:"column:title"`
		Difficulty    string `gorm:"column:difficulty"`
		StatementPath string `gorm:"column:statement_path"`
		TimeLimitMs   int    `gorm:"column:problem_time_limit_ms"`
		MemoryLimitKb int    `gorm:"column:problem_memory_limit_kb"`
	}

	if err := dbConn.Table("contest_problems").
		Select("contest_problems.*, problems.title, problems.difficulty, problems.statement_path, problems.time_limit_ms as problem_time_limit_ms, problems.memory_limit_kb as problem_memory_limit_kb").
		Joins("LEFT JOIN problems ON contest_problems.problem_id = problems.id").
		Where("contest_problems.contest_id = ? AND contest_problems.problem_id = ? AND problems.deleted_at IS NULL", contestID, problemID).
		First(&problem).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("problem not found in contest")
		}
		return nil, fmt.Errorf("failed to fetch contest problem: %w", err)
	}

	// Use per-contest overrides if available
	timeLimitMs := problem.TimeLimitMs
	if problem.ContestProblem.TimeLimitMs != nil {
		timeLimitMs = *problem.ContestProblem.TimeLimitMs
	}

	memoryLimitKb := problem.MemoryLimitKb
	if problem.ContestProblem.MemoryLimitKb != nil {
		memoryLimitKb = *problem.ContestProblem.MemoryLimitKb
	}

	item := &ContestProblemItem{
		ProblemID:        problem.ProblemID,
		Title:            problem.Title,
		Difficulty:       problem.Difficulty,
		Points:           problem.Points,
		Ordinal:          problem.Ordinal,
		TimeLimitMs:      timeLimitMs,
		MemoryLimitKb:    memoryLimitKb,
		AllowedLanguages: problem.ContestProblem.AllowedLanguages,
	}

	return item, nil
}

// AddProblemToContest adds a problem to a contest
func AddProblemToContest(contestProblem *models.ContestProblem) error {
	dbConn := getDB()

	// Check if problem exists
	var problem models.Problem
	if err := dbConn.Where("id = ? AND deleted_at IS NULL", contestProblem.ProblemID).First(&problem).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("problem not found")
		}
		return fmt.Errorf("failed to verify problem: %w", err)
	}

	if err := dbConn.Create(contestProblem).Error; err != nil {
		return fmt.Errorf("failed to add problem to contest: %w", err)
	}

	log.Printf("[REPO] Problem %s added to contest %s", contestProblem.ProblemID, contestProblem.ContestID)
	return nil
}

// UpdateContestProblem updates a problem's settings within a contest
func UpdateContestProblem(contestID, problemID string, updates map[string]interface{}) error {
	dbConn := getDB()

	if err := dbConn.Model(&models.ContestProblem{}).
		Where("contest_id = ? AND problem_id = ?", contestID, problemID).
		Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to update contest problem: %w", err)
	}

	log.Printf("[REPO] Contest problem updated: contest=%s, problem=%s", contestID, problemID)
	return nil
}

// RemoveProblemFromContest removes a problem from a contest
func RemoveProblemFromContest(contestID, problemID string) error {
	dbConn := getDB()

	if err := dbConn.Where("contest_id = ? AND problem_id = ?", contestID, problemID).
		Delete(&models.ContestProblem{}).Error; err != nil {
		return fmt.Errorf("failed to remove problem from contest: %w", err)
	}

	log.Printf("[REPO] Problem %s removed from contest %s", problemID, contestID)
	return nil
}

// GetContestSubmissionCount returns the number of submissions a user has made for a specific problem in a contest
func GetContestSubmissionCount(contestID, problemID, userID string) (int64, error) {
	dbConn := getDB()

	var count int64
	if err := dbConn.Model(&models.Submission{}).
		Where("contest_id = ? AND problem_id = ? AND user_id = ?", contestID, problemID, userID).
		Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count submissions: %w", err)
	}

	return count, nil
}

// ContestSubmissionItem represents a submission within a contest
type ContestSubmissionItem struct {
	ID            string    `json:"id"`
	ProblemID     string    `json:"problem_id"`
	ProblemTitle  string    `json:"problem_title"`
	UserID        string    `json:"user_id"`
	Username      string    `json:"username"`
	Language      string    `json:"language"`
	Status        string    `json:"status"`
	Score         *int      `json:"score,omitempty"`
	ExecutionTime *int      `json:"execution_time,omitempty"`
	MemoryUsage   *int      `json:"memory_usage,omitempty"`
	SubmittedAt   time.Time `json:"submitted_at"`
}

// ListContestSubmissionsResponse represents paginated contest submissions
type ListContestSubmissionsResponse struct {
	Items    []ContestSubmissionItem `json:"items"`
	Total    int64                   `json:"total"`
	Page     int                     `json:"page"`
	PageSize int                     `json:"page_size"`
}

// ListContestSubmissions returns submissions for a contest
func ListContestSubmissions(contestID, userID, problemID, status string, page, pageSize int) (*ListContestSubmissionsResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 50
	}
	if pageSize > 100 {
		pageSize = 100
	}

	offset := (page - 1) * pageSize
	dbConn := getDB()

	// Build query
	query := dbConn.Table("submissions").
		Select("submissions.id, submissions.problem_id, problems.title as problem_title, submissions.user_id, users.name as username, submissions.language, submissions.status, submissions.score, submissions.execution_time, submissions.memory_usage, submissions.submitted_at").
		Joins("LEFT JOIN problems ON submissions.problem_id = problems.id").
		Joins("LEFT JOIN users ON submissions.user_id = users.id").
		Where("submissions.contest_id = ?", contestID)

	if userID != "" {
		query = query.Where("submissions.user_id = ?", userID)
	}

	if problemID != "" {
		query = query.Where("submissions.problem_id = ?", problemID)
	}

	if status != "" {
		query = query.Where("submissions.status = ?", status)
	}

	// Count total
	var total int64
	countQuery := dbConn.Model(&models.Submission{}).Where("contest_id = ?", contestID)
	if userID != "" {
		countQuery = countQuery.Where("user_id = ?", userID)
	}
	if problemID != "" {
		countQuery = countQuery.Where("problem_id = ?", problemID)
	}
	if status != "" {
		countQuery = countQuery.Where("status = ?", status)
	}
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count submissions: %w", err)
	}

	// Fetch submissions
	var submissions []ContestSubmissionItem
	if err := query.Order("submissions.submitted_at DESC").
		Limit(pageSize).
		Offset(offset).
		Scan(&submissions).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch submissions: %w", err)
	}

	return &ListContestSubmissionsResponse{
		Items:    submissions,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

// GetSubmissionByID returns a submission by ID
func GetSubmissionByID(submissionID string) (*models.Submission, error) {
	dbConn := getDB()

	var submission models.Submission
	if err := dbConn.Where("id = ?", submissionID).First(&submission).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("submission not found")
		}
		return nil, fmt.Errorf("failed to fetch submission: %w", err)
	}

	return &submission, nil
}
