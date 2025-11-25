package db

import (
	"fmt"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"codehustle/backend/internal/config"
	"codehustle/backend/internal/constants"
	"codehustle/backend/internal/models"
)

// SeedAdminFromEnv creates an initial admin user if ADMIN_EMAIL and ADMIN_PASSWORD are set.
func SeedAdminFromEnv() error {
	email := strings.TrimSpace(config.Get("ADMIN_EMAIL"))
	password := config.Get("ADMIN_PASSWORD")
	if email == "" || password == "" {
		// Seeding is optional; skip if not provided.
		return nil
	}

	// Check if the user already exists.
	var existing int64
	if err := DB.Model(&models.User{}).Where("email = ?", email).Count(&existing).Error; err != nil {
		return fmt.Errorf("seed admin: count existing failed: %w", err)
	}
	if existing > 0 {
		return nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("seed admin: hash password failed: %w", err)
	}

	user := models.User{
		ID:            uuid.NewString(),
		Email:         email,
		PasswordHash:  string(hash),
		FirstName:     config.Get("ADMIN_FIRST_NAME"),
		LastName:      config.Get("ADMIN_LAST_NAME"),
		IsActive:      true,
		EmailVerified: true,
	}
	if err := DB.Create(&user).Error; err != nil {
		return fmt.Errorf("seed admin: create user failed: %w", err)
	}

	// Attach admin role if available.
	var roleID int
	if err := DB.Raw("SELECT id FROM roles WHERE name = ?", constants.RoleAdmin).Scan(&roleID).Error; err == nil && roleID != 0 {
		_ = DB.Exec("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id=user_id", user.ID, roleID).Error
	}

	return nil
}
