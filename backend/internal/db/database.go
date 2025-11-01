package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/go-sql-driver/mysql"
	"github.com/golang-migrate/migrate/v4"
	migrateMysql "github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"

	gormmysql "gorm.io/driver/mysql"
	"gorm.io/gorm"

	"codehustle/backend/internal/config"
)

// DB is the global database connection
var DB *gorm.DB

// Connect initializes the database connection
func Connect() error {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?parseTime=true",
		config.Get("DB_USER"),
		config.Get("DB_PASSWORD"),
		config.Get("DB_HOST"),
		config.Get("DB_PORT"),
		config.Get("DB_NAME"),
	)
	db, err := gorm.Open(gormmysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}
	DB = db
	return nil
}

// Migrate runs SQL migrations from the internal/db/migrations directory.
func Migrate() error {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?multiStatements=true",
		config.Get("DB_USER"),
		config.Get("DB_PASSWORD"),
		config.Get("DB_HOST"),
		config.Get("DB_PORT"),
		config.Get("DB_NAME"),
	)
	sqlDB, err := sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("migrate: failed to open database: %w", err)
	}
	driver, err := migrateMysql.WithInstance(sqlDB, &migrateMysql.Config{})
	if err != nil {
		return fmt.Errorf("migrate: failed to create migrate driver: %w", err)
	}
	cwd, _ := os.Getwd()
	sourceURL := "file://" + filepath.Join(cwd, "internal", "db", "migrations")
	m, err := migrate.NewWithDatabaseInstance(
		sourceURL,
		config.Get("DB_NAME"),
		driver,
	)
	if err != nil {
		return fmt.Errorf("migrate: failed to initialize migration instance: %w", err)
	}
	// Check if the DB is in a dirty state from a previous failed migration
	if version, dirty, verr := m.Version(); verr == nil && dirty {
		// Force the migration version to the current value to clear dirty state
		if ferr := m.Force(int(version)); ferr != nil {
			return fmt.Errorf("migrate: failed to force migration version %d: %w", version, ferr)
		}
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		errMsg := err.Error()
		// ignore duplicate index errors
		if strings.Contains(errMsg, "Duplicate key name") {
			// skip
		} else {
			return fmt.Errorf("migrate: up migrations failed: %w", err)
		}
	}
	return nil
}
