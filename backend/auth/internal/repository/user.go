package repository

import (
	"errors"

	"codehustle/backend/auth/internal/db"
	"codehustle/backend/auth/internal/models"

	"gorm.io/gorm"
)

func FindUserByEmail(email string) (*models.User, error) {
	var u models.User
	err := db.DB.Preload("Roles").Where("email = ?", email).First(&u).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &u, err
}

func FindUserByID(id string) (*models.User, error) {
	var u models.User
	err := db.DB.Preload("Roles").First(&u, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &u, err
}
