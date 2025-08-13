package db

import (
	"fmt"
	"log"

	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"codehustle/backend/auth/internal/config"
)

// DB is the global database instance
var DB *gorm.DB

// Connect initializes the database connection
func Connect() {
	dialect := config.Get("DB_DIALECT")
	host := config.Get("DB_HOST")
	port := config.Get("DB_PORT")
	user := config.Get("DB_USER")
	password := config.Get("DB_PASSWORD")
	dbname := config.Get("DB_NAME")

	var (
		gormDB *gorm.DB
		err    error
	)

	switch dialect {
	case "postgres", "postgresql":
		dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
			host, user, password, dbname, port,
		)
		gormDB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	case "mysql":
		// user:pass@tcp(host:port)/dbname?params
		dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&loc=Local",
			user, password, host, port, dbname,
		)
		gormDB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	default:
		log.Fatalf("unsupported DB_DIALECT: %s", dialect)
	}

	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}
	DB = gormDB
}
