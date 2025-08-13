package models

import (
	"time"

	"gorm.io/datatypes"
)

// AuthAuditLog records authentication-related events

type AuthAuditLog struct {
	ID        uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    *string        `gorm:"type:char(36);index:idx_user_time" json:"user_id,omitempty"`
	Event     string         `gorm:"size:50;not null" json:"event"`
	IP        string         `gorm:"size:45" json:"ip,omitempty"`
	UA        string         `gorm:"size:255" json:"ua,omitempty"`
	Meta      datatypes.JSON `gorm:"type:json" json:"meta,omitempty"`
	CreatedAt time.Time      `gorm:"autoCreateTime" json:"created_at"`
}
