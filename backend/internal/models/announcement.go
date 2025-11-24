package models

import "time"

// Announcement represents an announcement in the system
type Announcement struct {
	ID           string     `gorm:"type:char(36);primaryKey" json:"id"`
	Title        string     `gorm:"size:200;not null" json:"title"`
	Snippet      string     `gorm:"type:text" json:"snippet,omitempty"`
	Content      string     `gorm:"type:text;not null" json:"content"`
	Author       string     `gorm:"size:200" json:"author,omitempty"`
	Image        *string    `gorm:"type:text" json:"image,omitempty"`
	CreatedBy    string     `gorm:"type:char(36);not null;column:created_by" json:"created_by"`
	CreatedAt    time.Time  `gorm:"autoCreateTime;column:created_at" json:"date"`
	UpdatedAt    time.Time  `gorm:"autoUpdateTime;column:updated_at" json:"updated_at,omitempty"`
	VisibleUntil *time.Time `gorm:"column:visible_until" json:"visible_until,omitempty"`
	DeletedAt    *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
}

// AnnouncementRead represents the read status of an announcement by a user
type AnnouncementRead struct {
	UserID         string    `gorm:"type:char(36);primaryKey;column:user_id" json:"user_id"`
	AnnouncementID string    `gorm:"type:char(36);primaryKey;column:announcement_id" json:"announcement_id"`
	ReadAt         time.Time `gorm:"autoCreateTime;column:read_at" json:"read_at"`
}
