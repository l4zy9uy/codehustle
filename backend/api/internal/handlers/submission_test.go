package handlers_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"codehustle/backend/api/internal/handlers"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestListSubmissions(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	handlers.ListSubmissions(c)

	assert.Equal(t, http.StatusOK, w.Code)
}
