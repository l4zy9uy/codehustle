package models

import (
	"time"
)

type User struct {
	ID              string          `gorm:"type:char(36);primaryKey" json:"id"`
	Email           string          `gorm:"size:254;not null;unique" json:"email"`
	PasswordHash    string          `gorm:"size:255;not null" json:"-"`
	FirstName       string          `gorm:"size:50;default:''" json:"first_name"`
	LastName        string          `gorm:"size:100;default:''" json:"last_name"`
	IsActive        bool            `gorm:"default:true;not null" json:"is_active"`
	EmailVerified   bool            `gorm:"default:false;not null" json:"email_verified"`
	LastLoginAt     *time.Time      `json:"last_login_at,omitempty"`
	CreatedAt       time.Time       `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time       `gorm:"autoUpdateTime" json:"updated_at"`
	Roles           []Role          `gorm:"many2many:user_roles;constraint:OnDelete:CASCADE;" json:"roles,omitempty"`
	OAuthIdentities []OAuthIdentity `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;" json:"oauth_identities,omitempty"`
	RefreshTokens   []RefreshToken  `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;" json:"refresh_tokens,omitempty"`
}
