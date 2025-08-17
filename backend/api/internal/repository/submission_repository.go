package repository

import (
	"codehustle/backend/api/internal/db"
	"codehustle/backend/api/internal/models"
)

// CreateSubmission records a new submission
func CreateSubmission(s *models.Submission) error {
	return db.DB.Create(s).Error
}

// ListSubmissionsByUser returns submissions by a user
func ListSubmissionsByUser(userID string) ([]models.Submission, error) {
	var subs []models.Submission
	err := db.DB.Where("user_id = ?", userID).Find(&subs).Error
	return subs, err
}
