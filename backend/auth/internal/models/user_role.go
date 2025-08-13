package models

// UserRole is the join table for users and roles

type UserRole struct {
	UserID string `gorm:"type:char(36);primaryKey" json:"user_id"`
	RoleID int    `gorm:"primaryKey" json:"role_id"`
}
