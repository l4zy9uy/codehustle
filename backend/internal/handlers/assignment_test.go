package handlers_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"codehustle/backend/internal/handlers"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestListAssignments(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	handlers.ListAssignments(c)

	assert.Equal(t, http.StatusOK, w.Code)
}
