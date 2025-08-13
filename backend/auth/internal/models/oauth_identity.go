package models

import (
	"time"
)

// OAuthIdentity links an external provider identity to a user

type OAuthIdentity struct {
	ID          string    `gorm:"type:char(36);primaryKey" json:"id"`
	UserID      string    `gorm:"type:char(36);not null" json:"user_id"`
	Provider    string    `gorm:"size:50;not null;uniqueIndex:uq_provider_sub" json:"provider"`
	ProviderSub string    `gorm:"size:255;not null;uniqueIndex:uq_provider_sub" json:"provider_sub"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	User        User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;" json:"-"`
}
