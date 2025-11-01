package models

type OAuthIdentity struct {
	ID          string `gorm:"type:char(36);primaryKey" json:"id"`
	UserID      string `gorm:"type:char(36);not null;column:user_id" json:"user_id"`
	Provider    string `gorm:"size:50;not null" json:"provider"`
	ProviderSub string `gorm:"size:255;not null;column:provider_sub" json:"provider_sub"`
}
