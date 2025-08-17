package db

import (
	"database/sql"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
	"github.com/golang-migrate/migrate/v4"
	migrateMysql "github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"codehustle/backend/api/internal/config"
)

// DB is the global database connection
var DB *gorm.DB

// Connect initializes the database connection
func Connect() error {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		config.Get("DB_USER"),
		config.Get("DB_PASSWORD"),
		config.Get("DB_HOST"),
		config.Get("DB_PORT"),
		config.Get("DB_NAME"),
	)
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}
	DB = db
	return nil
}

// Migrate runs SQL migrations from the internal/db/migrations directory.
func Migrate() error {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?multiStatements=true",
		config.Get("DB_USER"),
		config.Get("DB_PASSWORD"),
		config.Get("DB_HOST"),
		config.Get("DB_PORT"),
		config.Get("DB_NAME"),
	)
	sqlDB, err := sql.Open("mysql", dsn)
	if err != nil {
		return err
	}
	driver, err := migrateMysql.WithInstance(sqlDB, &migrateMysql.Config{})
	if err != nil {
		return err
	}
	m, err := migrate.NewWithDatabaseInstance(
		"file://internal/db/migrations",
		config.Get("DB_NAME"),
		driver,
	)
	if err != nil {
		return err
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return err
	}
	return nil
}
