package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ListCourses returns a list of courses
func ListCourses(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"courses": []interface{}{}})
}
