package models

import "time"

// TestCase represents a test case for a problem, storing file paths.
type TestCase struct {
	ID                 string    `gorm:"type:char(36);primaryKey" json:"id"`
	ProblemID          string    `gorm:"type:char(36);not null;index;column:problem_id" json:"problem_id"`
	Name               string    `gorm:"size:200;not null" json:"name"`
	InputPath          string    `gorm:"type:text;not null;column:input_path" json:"input_path"`
	ExpectedOutputPath string    `gorm:"type:text;not null;column:expected_output_path" json:"expected_output_path"`
	Weight             int       `gorm:"default:1" json:"weight"`
	IsSample           bool      `gorm:"column:is_sample;default:false" json:"is_sample"`
	CreatedAt          time.Time `gorm:"autoCreateTime;column:created_at" json:"created_at"`
}
