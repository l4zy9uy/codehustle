package models

import "time"

// TestCase represents a test case for an assignment, storing file paths.
type TestCase struct {
	ID                 string    `gorm:"type:char(36);primaryKey" json:"id"`
	AssignmentID       string    `gorm:"type:char(36);not null;index" json:"assignment_id"`
	InputPath          string    `gorm:"type:text;not null" json:"input_path"`
	ExpectedOutputPath string    `gorm:"type:text;not null" json:"expected_output_path"`
	Weight             int       `gorm:"default:1" json:"weight"`
	CreatedAt          time.Time `gorm:"autoCreateTime" json:"created_at"`
}
