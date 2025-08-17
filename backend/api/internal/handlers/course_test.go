package handlers_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"codehustle/backend/api/internal/handlers"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestListCourses(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	handlers.ListCourses(c)

	assert.Equal(t, http.StatusOK, w.Code)
	// Optionally verify JSON structure
	// var resp map[string]interface{}
	// err := json.Unmarshal(w.Body.Bytes(), &resp)
	// assert.NoError(t, err)
}
