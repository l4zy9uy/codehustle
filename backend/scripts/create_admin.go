package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"codehustle/backend/internal/config"
	"codehustle/backend/internal/constants"
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/models"
)

func main() {
	// Define command-line flags
	email := flag.String("email", "", "Admin email address (required)")
	password := flag.String("password", "", "Admin password (required)")
	firstName := flag.String("first-name", "", "Admin first name (optional, defaults to 'Admin')")
	lastName := flag.String("last-name", "", "Admin last name (optional, defaults to 'User')")
	flag.Parse()

	// Validate required flags
	if *email == "" || *password == "" {
		fmt.Fprintf(os.Stderr, "Error: --email and --password are required\n\n")
		fmt.Fprintf(os.Stderr, "Usage:\n")
		fmt.Fprintf(os.Stderr, "  ./create-admin --email <email> --password <password> [--first-name <name>] [--last-name <name>]\n\n")
		fmt.Fprintf(os.Stderr, "Example:\n")
		fmt.Fprintf(os.Stderr, "  ./create-admin --email admin@example.com --password securepass --first-name Admin --last-name User\n")
		os.Exit(1)
	}

	// Set defaults for optional fields
	if *firstName == "" {
		*firstName = "Admin"
	}
	if *lastName == "" {
		*lastName = "User"
	}

	// Load configuration
	config.LoadEnv()
	config.EnsureDefaults()

	// Initialize database
	if err := db.Connect(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Check if user already exists
	var existingUser models.User
	if err := db.DB.Where("email = ?", *email).First(&existingUser).Error; err == nil {
		fmt.Printf("⚠ User with email %s already exists (ID: %s)\n", *email, existingUser.ID)

		// Check if user already has admin role
		var roleID int
		if err := db.DB.Raw("SELECT id FROM roles WHERE name = ?", constants.RoleAdmin).Scan(&roleID).Error; err != nil {
			log.Fatalf("Failed to find admin role: %v", err)
		}

		var count int64
		db.DB.Raw("SELECT COUNT(*) FROM user_roles WHERE user_id = ? AND role_id = ?", existingUser.ID, roleID).Scan(&count)

		if count > 0 {
			fmt.Printf("✓ User already has admin role assigned.\n")
			os.Exit(0)
		} else {
			// Assign admin role to existing user
			if err := db.DB.Exec("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id=user_id", existingUser.ID, roleID).Error; err != nil {
				log.Fatalf("Failed to assign admin role: %v", err)
			}
			fmt.Printf("✓ Admin role assigned to existing user.\n")
			os.Exit(0)
		}
	}

	// Hash password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(*password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	// Create user
	userID := uuid.NewString()
	user := models.User{
		ID:            userID,
		Email:         *email,
		PasswordHash:  string(passwordHash),
		FirstName:     *firstName,
		LastName:      *lastName,
		IsActive:      true,
		EmailVerified: true, // Admin accounts are verified by default
	}

	if err := db.DB.Create(&user).Error; err != nil {
		log.Fatalf("Failed to create user: %v", err)
	}

	// Get admin role ID
	var roleID int
	if err := db.DB.Raw("SELECT id FROM roles WHERE name = ?", constants.RoleAdmin).Scan(&roleID).Error; err != nil {
		log.Fatalf("Failed to find admin role: %v", err)
	}

	if roleID == 0 {
		log.Fatalf("Admin role not found in database")
	}

	// Assign admin role
	if err := db.DB.Exec("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id=user_id", userID, roleID).Error; err != nil {
		log.Fatalf("Failed to assign admin role: %v", err)
	}

	// Success output
	fmt.Printf("✓ Admin account created successfully!\n")
	fmt.Printf("  Email: %s\n", *email)
	fmt.Printf("  Password: %s\n", *password)
	fmt.Printf("  First Name: %s\n", *firstName)
	fmt.Printf("  Last Name: %s\n", *lastName)
	fmt.Printf("  User ID: %s\n", userID)
	fmt.Printf("  Role: %s\n", constants.RoleAdmin)
}
