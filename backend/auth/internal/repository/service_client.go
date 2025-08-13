package repository

import (
	"errors"

	"codehustle/backend/auth/internal/db"
	"codehustle/backend/auth/internal/models"

	"gorm.io/gorm"
)

func FindServiceClientByID(id string) (*models.ServiceClient, error) {
	var sc models.ServiceClient
	err := db.DB.Where("id = ? AND is_active = 1", id).First(&sc).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &sc, err
}
