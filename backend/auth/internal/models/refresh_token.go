package models

import (
	"time"
)

// RefreshToken represents a long-lived token for session renewal

type RefreshToken struct {
	ID         string     `gorm:"type:char(36);primaryKey" json:"id"`
	UserID     string     `gorm:"type:char(36);not null;index:idx_user_exp" json:"user_id"`
	FamilyID   string     `gorm:"type:char(36);not null;index:idx_family" json:"family_id"`
	TokenHash  string     `gorm:"size:255;not null" json:"-"`
	IsRevoked  bool       `gorm:"default:false;not null" json:"is_revoked"`
	LastUsedAt *time.Time `json:"last_used_at,omitempty"`
	ExpiresAt  time.Time  `gorm:"not null" json:"expires_at"`
	CreatedAt  time.Time  `gorm:"autoCreateTime" json:"created_at"`
	User       User       `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;" json:"-"`
}
