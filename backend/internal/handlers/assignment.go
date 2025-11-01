package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ListAssignments returns a list of assignments
func ListAssignments(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"assignments": []interface{}{}})
}
