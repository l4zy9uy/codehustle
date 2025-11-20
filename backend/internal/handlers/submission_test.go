package handlers_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"codehustle/backend/internal/config"
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/handlers"
	"codehustle/backend/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestListSubmissions(t *testing.T) {
	// Initialize config and database
	config.LoadEnv()
	config.EnsureDefaults()
	
	// Try to connect to database, skip test if unavailable
	if err := db.Connect(); err != nil {
		t.Skipf("Skipping test: database connection failed: %v", err)
	}

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	// Set up mock user context
	userCtx := middleware.UserContext{
		ID:    "test-user-id",
		Email: "test@example.com",
		Roles: []string{"student"},
	}
	c.Set("user", userCtx)

	handlers.ListSubmissions(c)

	assert.Equal(t, http.StatusOK, w.Code)
}
