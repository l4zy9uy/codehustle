package models

import "time"

// Course represents a course in the system
type Course struct {
	ID          string    `gorm:"type:char(36);primaryKey" json:"id"`
	Title       string    `gorm:"size:200;not null" json:"title"`
	Description string    `gorm:"type:text" json:"description,omitempty"`
	IsPublic    bool      `gorm:"default:true" json:"is_public"`
	CreatedBy   string    `gorm:"type:char(36);not null" json:"created_by"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
}
