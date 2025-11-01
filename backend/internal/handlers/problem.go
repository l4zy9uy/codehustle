package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"codehustle/backend/internal/middleware"
	"codehustle/backend/internal/repository"
)

// ListProblems returns a list of problems
func ListProblems(c *gin.Context) {
	// Get user context to check if they're admin/lecturer (can see private problems)
	userCtx, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing_user_context"})
		return
	}

	// Check if user is admin or lecturer to show all problems
	isPublicOnly := true
	if userCtxVal, ok := userCtx.(middleware.UserContext); ok {
		log.Printf("[PROBLEM] User roles: %v", userCtxVal.Roles)
		for _, role := range userCtxVal.Roles {
			if role == "admin" || role == "lecturer" || role == "instructor" {
				isPublicOnly = false
				log.Printf("[PROBLEM] User has privileged role: %s, showing all problems", role)
				break
			}
		}
	}

	log.Printf("[PROBLEM] Query filter: isPublicOnly = %v", isPublicOnly)

	problems, err := repository.ListProblems(isPublicOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_fetch_problems",
			"message": err.Error(),
		})
		return
	}

	log.Printf("[PROBLEM] Found %d problems", len(problems))
	c.JSON(http.StatusOK, gin.H{"problems": problems})
}

// GetProblem returns a single problem by ID
func GetProblem(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_problem_id"})
		return
	}

	problem, err := repository.GetProblem(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "problem_not_found",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"problem": problem})
}
