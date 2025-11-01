package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ListSubmissions returns a list of submissions
func ListSubmissions(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"submissions": []interface{}{}})
}
