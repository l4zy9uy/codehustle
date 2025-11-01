package models

import "time"

// Problem represents a problem in the system
type Problem struct {
	ID            string    `gorm:"type:char(36);primaryKey" json:"id"`
	Title         string    `gorm:"size:200;not null" json:"title"`
	Slug          string    `gorm:"size:120;uniqueIndex;column:slug" json:"slug"`
	StatementPath string    `gorm:"type:text;not null;column:statement_path" json:"statement_path"`
	Difficulty    string    `gorm:"size:50" json:"difficulty,omitempty"`
	IsPublic      bool      `gorm:"column:is_public" json:"is_public"`
	TimeLimitMs   int       `gorm:"column:time_limit_ms;default:2000;not null" json:"time_limit_ms"`
	MemoryLimitKb int       `gorm:"column:memory_limit_kb;default:262144;not null" json:"memory_limit_kb"`
	CreatedBy     string    `gorm:"type:char(36);not null;column:created_by" json:"created_by"`
	CreatedAt     time.Time `gorm:"autoCreateTime;column:created_at" json:"created_at"`
}
