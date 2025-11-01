package models

import (
	"time"
)

// User represents a system user
type User struct {
	ID            string     `gorm:"type:char(36);primaryKey" json:"id"`
	Email         string     `gorm:"uniqueIndex;size:254" json:"email"`
	PasswordHash  string     `gorm:"size:255" json:"-"`
	FirstName     string     `gorm:"size:50" json:"first_name"`
	LastName      string     `gorm:"size:100" json:"last_name"`
	IsActive      bool       `gorm:"default:true" json:"is_active"`
	EmailVerified bool       `gorm:"default:false" json:"email_verified"`
	LastLoginAt   *time.Time `json:"last_login_at"`
	CreatedAt     time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt     time.Time  `gorm:"default:CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" json:"updated_at"`
	Roles         []string   `gorm:"-" json:"roles"` // fill manually or via join
}
