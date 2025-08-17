package repository

import (
	"codehustle/backend/api/internal/db"
	"codehustle/backend/api/internal/models"
)

// EnrollStudent registers a student in a course
func EnrollStudent(courseID, userID string) error {
	enrollment := &models.CourseEnrollment{CourseID: courseID, UserID: userID}
	return db.DB.Create(enrollment).Error
}

// ListEnrolledCourses returns courses a user is enrolled in
func ListEnrolledCourses(userID string) ([]models.CourseEnrollment, error) {
	var enrollments []models.CourseEnrollment
	err := db.DB.Where("user_id = ?", userID).Find(&enrollments).Error
	return enrollments, err
}
