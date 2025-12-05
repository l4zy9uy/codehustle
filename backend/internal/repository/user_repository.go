package repository

import (
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/models"
)

// ListUsersResponse represents a paginated list of users
type ListUsersResponse struct {
	Users    []UserListItem `json:"users"`
	Total    int64          `json:"total"`
	Page     int            `json:"page"`
	PageSize int            `json:"page_size"`
}

// UserListItem represents a single user in the list
type UserListItem struct {
	ID            string   `json:"id"`
	Email         string   `json:"email"`
	FirstName     string   `json:"first_name"`
	LastName      string   `json:"last_name"`
	IsActive      bool     `json:"is_active"`
	EmailVerified bool     `json:"email_verified"`
	LastLoginAt   *string  `json:"last_login_at,omitempty"`
	CreatedAt     string   `json:"created_at"`
	Roles         []string `json:"roles"`
}

// ListUsers returns paginated users with optional keyword search
func ListUsers(page, pageSize int, keyword string) (*ListUsersResponse, error) {
	var users []models.User
	query := db.DB.Model(&models.User{})

	// Apply keyword search if provided
	if keyword != "" {
		query = query.Where("email LIKE ? OR first_name LIKE ? OR last_name LIKE ?",
			"%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	// Apply pagination
	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&users).Error; err != nil {
		return nil, err
	}

	// Load roles for each user and build response
	var userList []UserListItem
	for _, user := range users {
		var roles []string
		db.DB.Raw(`
			SELECT r.name 
			FROM roles r 
			INNER JOIN user_roles ur ON r.id = ur.role_id 
			WHERE ur.user_id = ?
		`, user.ID).Scan(&roles)

		var lastLoginAt *string
		if user.LastLoginAt != nil {
			formatted := user.LastLoginAt.Format("2006-01-02T15:04:05Z07:00")
			lastLoginAt = &formatted
		}

		userList = append(userList, UserListItem{
			ID:            user.ID,
			Email:         user.Email,
			FirstName:     user.FirstName,
			LastName:      user.LastName,
			IsActive:      user.IsActive,
			EmailVerified: user.EmailVerified,
			LastLoginAt:   lastLoginAt,
			CreatedAt:     user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			Roles:         roles,
		})
	}

	return &ListUsersResponse{
		Users:    userList,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

// GetUserByID returns a user by ID with roles
func GetUserByID(userID string) (*models.User, []string, error) {
	var user models.User
	if err := db.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, nil, err
	}

	// Load roles
	var roles []string
	db.DB.Raw(`
		SELECT r.name 
		FROM roles r 
		INNER JOIN user_roles ur ON r.id = ur.role_id 
		WHERE ur.user_id = ?
	`, user.ID).Scan(&roles)

	return &user, roles, nil
}

// GetUserByEmail returns a user by email
func GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	if err := db.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// CreateUser creates a new user
func CreateUser(user *models.User) error {
	return db.DB.Create(user).Error
}

// UpdateUser updates an existing user
func UpdateUser(user *models.User) error {
	return db.DB.Save(user).Error
}

// DeleteUser deletes a user by ID
func DeleteUser(userID string) error {
	return db.DB.Where("id = ?", userID).Delete(&models.User{}).Error
}

// DeleteUsersBatch deletes multiple users by IDs
func DeleteUsersBatch(userIDs []string) error {
	if len(userIDs) == 0 {
		return nil
	}
	return db.DB.Where("id IN ?", userIDs).Delete(&models.User{}).Error
}

// AssignRole assigns a role to a user
func AssignRole(userID string, roleName string) error {
	var roleID int
	if err := db.DB.Raw("SELECT id FROM roles WHERE name = ?", roleName).Scan(&roleID).Error; err != nil {
		return err
	}

	return db.DB.Exec("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id=user_id", userID, roleID).Error
}

// RemoveRole removes a role from a user
func RemoveRole(userID string, roleName string) error {
	var roleID int
	if err := db.DB.Raw("SELECT id FROM roles WHERE name = ?", roleName).Scan(&roleID).Error; err != nil {
		return err
	}

	return db.DB.Exec("DELETE FROM user_roles WHERE user_id = ? AND role_id = ?", userID, roleID).Error
}

// SetUserRoles sets the roles for a user (replaces existing roles)
func SetUserRoles(userID string, roleNames []string) error {
	// Start transaction
	tx := db.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Remove all existing roles
	if err := tx.Exec("DELETE FROM user_roles WHERE user_id = ?", userID).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Add new roles
	for _, roleName := range roleNames {
		var roleID int
		if err := tx.Raw("SELECT id FROM roles WHERE name = ?", roleName).Scan(&roleID).Error; err != nil {
			tx.Rollback()
			return err
		}

		if err := tx.Exec("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", userID, roleID).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}

