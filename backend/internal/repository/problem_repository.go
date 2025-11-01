package repository

import (
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/models"
)

// ListProblems returns all problems (optionally filtered by is_public)
func ListProblems(isPublicOnly bool) ([]models.Problem, error) {
	var problems []models.Problem
	query := db.DB.Model(&models.Problem{})

	if isPublicOnly {
		query = query.Where("is_public = ?", 1)
	}

	err := query.Find(&problems).Error
	return problems, err
}

// GetProblem retrieves a problem by ID
func GetProblem(id string) (*models.Problem, error) {
	var problem models.Problem
	err := db.DB.First(&problem, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &problem, nil
}

// CreateProblem inserts a new problem
func CreateProblem(p *models.Problem) error {
	return db.DB.Create(p).Error
}
