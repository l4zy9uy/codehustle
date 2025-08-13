package repository

import (
	"errors"

	"codehustle/backend/auth/internal/db"
	"codehustle/backend/auth/internal/models"

	"gorm.io/gorm"
)

func FindOAuthIdentity(provider, sub string) (*models.OAuthIdentity, error) {
	var oi models.OAuthIdentity
	err := db.DB.Where("provider = ? AND provider_sub = ?", provider, sub).First(&oi).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &oi, err
}

func CreateOAuthIdentity(oi *models.OAuthIdentity) error {
	return db.DB.Create(oi).Error
}
