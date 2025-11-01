package main

import (
	"fmt"

	_ "codehustle/backend/docs"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"codehustle/backend/internal/config"
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/middleware"
	"codehustle/backend/internal/routes"
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

	r := gin.Default()

	// CORS middleware
	r.Use(middleware.CORSMiddleware())

	// Authentication middleware (delegates to auth service)
	r.Use(middleware.AuthMiddleware())

	// Register API routes
	routes.RegisterRoutes(r)

	// Swagger endpoint
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	port := ":8081"
	fmt.Println("Starting business backend server on port", port)
	r.Run(port)
}
