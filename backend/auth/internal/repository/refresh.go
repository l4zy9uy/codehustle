package repository

import (
	"time"

	"codehustle/backend/auth/internal/db"
	"codehustle/backend/auth/internal/models"
)

func CreateRefreshToken(rt *models.RefreshToken) error {
	return db.DB.Create(rt).Error
}

func GetRefreshTokenByID(id string) (*models.RefreshToken, error) {
	var rt models.RefreshToken
	if err := db.DB.First(&rt, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &rt, nil
}

func RevokeRefreshToken(id string) error {
	return db.DB.Model(&models.RefreshToken{}).Where("id = ?", id).Update("is_revoked", true).Error
}

func RevokeFamily(familyID string) error {
	return db.DB.Model(&models.RefreshToken{}).Where("family_id = ?", familyID).Update("is_revoked", true).Error
}

func MarkUsedNow(id string) error {
	now := time.Now()
	return db.DB.Model(&models.RefreshToken{}).Where("id = ?", id).Update("last_used_at", &now).Error
}
