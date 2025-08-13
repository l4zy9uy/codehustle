package repository

import (
	"codehustle/backend/auth/internal/db"
	"codehustle/backend/auth/internal/models"
)

func WriteAudit(a *models.AuthAuditLog) error {
	return db.DB.Create(a).Error
}
