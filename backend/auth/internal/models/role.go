package models

// Role represents a user role
// Many-to-many relation with User via user_roles

type Role struct {
	ID          int    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string `gorm:"size:50;not null;unique" json:"name"`
	Description string `gorm:"size:200" json:"description,omitempty"`
	Users       []User `gorm:"many2many:user_roles;constraint:OnDelete:CASCADE;" json:"users,omitempty"`
}
