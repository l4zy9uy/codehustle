package repository

import (
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/models"
)

// CreateAssignment inserts a new assignment
func CreateAssignment(a *models.Assignment) error {
	return db.DB.Create(a).Error
}

// GetAssignment retrieves an assignment by ID
func GetAssignment(id string) (*models.Assignment, error) {
	var a models.Assignment
	err := db.DB.First(&a, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// ListAssignmentsByCourse returns assignments for a course
func ListAssignmentsByCourse(courseID string) ([]models.Assignment, error) {
	var assignments []models.Assignment
	err := db.DB.Where("course_id = ?", courseID).Find(&assignments).Error
	return assignments, err
}
