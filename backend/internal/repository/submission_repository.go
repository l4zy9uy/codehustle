package repository

import (
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/models"
)

// CreateSubmission records a new submission
func CreateSubmission(s *models.Submission) error {
	return db.DB.Create(s).Error
}

// GetSubmission retrieves a submission by ID with test case results
func GetSubmission(submissionID string) (*models.Submission, error) {
	var submission models.Submission
	err := db.DB.Where("id = ?", submissionID).
		Preload("TestCaseResults.TestCase").
		First(&submission).Error
	if err != nil {
		return nil, err
	}
	return &submission, nil
}

// ListSubmissions returns submissions with optional filters
func ListSubmissions(userID, problemID string, page, pageSize int) ([]models.Submission, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 25
	}
	if pageSize > 100 {
		pageSize = 100
	}

	offset := (page - 1) * pageSize

	// Build query
	query := db.DB.Model(&models.Submission{})
	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}
	if problemID != "" {
		query = query.Where("problem_id = ?", problemID)
	}

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	var submissions []models.Submission
	err := query.Order("submitted_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&submissions).Error

	return submissions, total, err
}
