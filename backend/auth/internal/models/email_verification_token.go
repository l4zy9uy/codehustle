package models

import (
	"time"
)

// EmailVerificationToken stores one-time tokens for email confirmation

type EmailVerificationToken struct {
	ID        string     `gorm:"type:char(36);primaryKey" json:"id"`
	UserID    string     `gorm:"type:char(36);not null;uniqueIndex:uq_user_pending" json:"user_id"`
	TokenHash string     `gorm:"size:255;not null" json:"-"`
	ExpiresAt time.Time  `gorm:"not null" json:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty"`
	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	User      User       `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;" json:"-"`
}
