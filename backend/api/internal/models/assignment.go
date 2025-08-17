package models

import "time"

// Assignment represents a problem or assignment in a course
type Assignment struct {
	ID          string     `gorm:"type:char(36);primaryKey" json:"id"`
	CourseID    string     `gorm:"type:char(36);not null" json:"course_id"`
	Title       string     `gorm:"size:200;not null" json:"title"`
	Description string     `gorm:"type:text" json:"description,omitempty"`
	Difficulty  string     `gorm:"size:50" json:"difficulty"`
	TestCases   string     `gorm:"type:json;not null" json:"test_cases"`
	IsPublished bool       `gorm:"default:false" json:"is_published"`
	Deadline    *time.Time `json:"deadline,omitempty"`
	CreatedAt   time.Time  `gorm:"autoCreateTime" json:"created_at"`
}
