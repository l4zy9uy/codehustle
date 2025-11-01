package repository

import (
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/models"
)

// CreateCourse inserts a new course
func CreateCourse(c *models.Course) error {
	return db.DB.Create(c).Error
}

// GetCourse retrieves a course by ID
func GetCourse(id string) (*models.Course, error) {
	var course models.Course
	err := db.DB.First(&course, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &course, nil
}

// ListCourses returns all courses
func ListCourses() ([]models.Course, error) {
	var courses []models.Course
	err := db.DB.Find(&courses).Error
	return courses, err
}
