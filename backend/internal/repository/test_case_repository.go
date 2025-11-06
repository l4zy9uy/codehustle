package repository

import (
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/models"
)

// GetTestCasesByProblemID returns all test cases for a problem
func GetTestCasesByProblemID(problemID string) ([]models.TestCase, error) {
	var testCases []models.TestCase
	err := db.DB.Where("problem_id = ?", problemID).
		Order("created_at ASC").
		Find(&testCases).Error
	return testCases, err
}

// GetProblemJudgeByProblemID returns the judge configuration for a problem
func GetProblemJudgeByProblemID(problemID string) (*models.ProblemJudge, error) {
	var judge models.ProblemJudge
	err := db.DB.Where("problem_id = ?", problemID).First(&judge).Error
	if err != nil {
		return nil, err
	}
	return &judge, nil
}
