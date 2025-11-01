package models

import "time"

// Submission represents a user's code submission to an assignment
type Submission struct {
	ID            string    `gorm:"type:char(36);primaryKey" json:"id"`
	AssignmentID  string    `gorm:"type:char(36);not null" json:"assignment_id"`
	UserID        string    `gorm:"type:char(36);not null" json:"user_id"`
	Code          string    `gorm:"type:text;not null" json:"code"`
	Language      string    `gorm:"size:50;not null" json:"language"`
	Status        string    `gorm:"size:50;not null;default:'pending'" json:"status"`
	Score         int       `json:"score"`
	ExecutionTime int       `json:"execution_time"` // milliseconds
	MemoryUsage   int       `json:"memory_usage"`   // KB
	SubmittedAt   time.Time `gorm:"autoCreateTime" json:"submitted_at"`
}
