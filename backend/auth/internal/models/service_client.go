package models

import (
	"time"
)

// ServiceClient represents a client application with HMAC credentials

type ServiceClient struct {
	ID             string    `gorm:"type:char(36);primaryKey" json:"id"`
	Name           string    `gorm:"size:100;not null" json:"name"`
	HMACSecretHash string    `gorm:"size:255;not null" json:"-"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
	IsActive       bool      `gorm:"default:true;not null" json:"is_active"`
}
