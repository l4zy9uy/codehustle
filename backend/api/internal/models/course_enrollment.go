package models

import "time"

// CourseEnrollment links a user to a course
type CourseEnrollment struct {
	CourseID   string    `gorm:"type:char(36);primaryKey" json:"course_id"`
	UserID     string    `gorm:"type:char(36);primaryKey" json:"user_id"`
	EnrolledAt time.Time `gorm:"autoCreateTime" json:"enrolled_at"`
}
