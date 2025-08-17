package main

import (
	"fmt"

	_ "codehustle/backend/api/docs"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"codehustle/backend/api/internal/middleware"
	"codehustle/backend/api/internal/routes"
)

func main() {
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
