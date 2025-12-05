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

// CreateTestCase creates a new test case record
func CreateTestCase(testCase *models.TestCase) error {
	return db.DB.Create(testCase).Error
}

// CreateTestCasesBatch creates multiple test cases in a batch
func CreateTestCasesBatch(testCases []models.TestCase) error {
	if len(testCases) == 0 {
		return nil
	}
	return db.DB.Create(&testCases).Error
}

// GetTestCaseByID returns a test case by its ID
func GetTestCaseByID(testCaseID string) (*models.TestCase, error) {
	var testCase models.TestCase
	err := db.DB.Where("id = ?", testCaseID).First(&testCase).Error
	if err != nil {
		return nil, err
	}
	return &testCase, nil
}

// DeleteTestCase deletes a test case by ID
func DeleteTestCase(testCaseID string) error {
	return db.DB.Where("id = ?", testCaseID).Delete(&models.TestCase{}).Error
}

// DeleteTestCasesBatch deletes multiple test cases by IDs
func DeleteTestCasesBatch(testCaseIDs []string) error {
	if len(testCaseIDs) == 0 {
		return nil
	}
	return db.DB.Where("id IN ?", testCaseIDs).Delete(&models.TestCase{}).Error
}

// DeleteTestCasesByProblemID deletes all test cases for a problem
func DeleteTestCasesByProblemID(problemID string) error {
	return db.DB.Where("problem_id = ?", problemID).Delete(&models.TestCase{}).Error
}
