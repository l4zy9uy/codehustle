package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"codehustle/backend/api/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestCORSMiddleware(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(middleware.CORSMiddleware())
	r.GET("/ping", func(c *gin.Context) {
		c.String(http.StatusOK, "pong")
	})

	// Test OPTIONS preflight
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("OPTIONS", "/ping", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusNoContent, w.Code)
	assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))

	// Test GET
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/ping", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
}

func TestRequireRoleMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var req *http.Request

	// Handler that requires 'admin' role
	r := gin.New()
	r.Use(func(c *gin.Context) {
		// Simulate user with 'student' role
		c.Set("user", middleware.UserContext{Roles: []string{"student"}})
		c.Next()
	})
	r.GET("/admin-only", middleware.RequireRole("admin"), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	// Expect forbidden for 'student'
	w := httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/admin-only", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)

	// Now simulate 'admin' role
	r = gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("user", middleware.UserContext{Roles: []string{"admin", "student"}})
		c.Next()
	})
	r.GET("/admin-only", middleware.RequireRole("admin"), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/admin-only", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}
