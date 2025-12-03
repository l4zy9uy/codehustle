package main

import (
	"fmt"

	_ "codehustle/backend/docs"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"codehustle/backend/internal/config"
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/handlers"
	"codehustle/backend/internal/middleware"
	"codehustle/backend/internal/queue"
	"codehustle/backend/internal/routes"
	"codehustle/backend/internal/storage"
)

func main() {
	// Load configuration
	config.LoadEnv()
	config.EnsureDefaults()

	// Initialize database
	if err := db.Connect(); err != nil {
		panic(err)
	}
	// Run SQL migrations
	if err := db.Migrate(); err != nil {
		panic(fmt.Sprintf("database migration failed: %v", err))
	}
	// Seed initial admin if env vars are provided
	if err := db.SeedAdminFromEnv(); err != nil {
		panic(fmt.Sprintf("admin seed failed: %v", err))
	}

	// Initialize MinIO
	if err := storage.InitMinIO(); err != nil {
		panic(fmt.Sprintf("failed to initialize MinIO: %v", err))
	}

	// Initialize Redis
	redisAddr := config.Get("REDIS_ADDR")
	redisPassword := config.Get("REDIS_PASSWORD")
	if err := queue.InitRedis(redisAddr, redisPassword); err != nil {
		panic(fmt.Sprintf("failed to initialize Redis: %v", err))
	}

	// Set Gin mode based on environment
	if config.Get("ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// CORS middleware
	r.Use(middleware.CORSMiddleware())

	// Health check endpoint
	r.GET("/health", handlers.HealthCheck)

	// Register API routes (auth middleware is applied per route group)
	routes.RegisterRoutes(r)

	// Swagger endpoint
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	port := ":8081"
	fmt.Println("Starting business backend server on port", port)
	r.Run(port)
}
