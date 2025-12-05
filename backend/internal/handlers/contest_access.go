package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"codehustle/backend/internal/middleware"
	"codehustle/backend/internal/repository"
)

// ContestAccessResponse represents the access check response
type ContestAccessResponse struct {
	ContestID        string `json:"contest_id"`
	CanAccess        bool   `json:"can_access"`
	IsRegistered     bool   `json:"is_registered"`
	IsPublic         bool   `json:"is_public"`
	RequiresPassword bool   `json:"requires_password"`
	Status           string `json:"status"`
}

// CheckContestAccess handles GET /api/v1/contest/access - check if user has access to contest
func CheckContestAccess(c *gin.Context) {
	contestID := c.Query("contest_id")
	if contestID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_contest_id"})
		return
	}

	// Get user context
	userID := ""
	userRole := ""
	userCtx, exists := c.Get("user")
	if exists {
		if userCtxVal, ok := userCtx.(middleware.UserContext); ok {
			userID = userCtxVal.ID
			userRole = getPrimaryRole(userCtxVal.Roles)
		}
	}

	log.Printf("[CONTEST_ACCESS] CheckContestAccess: contestID=%s, userID=%s, userRole=%s", contestID, userID, userRole)

	contest, isRegistered, canAccess, err := repository.CheckContestAccess(contestID, userID, userRole)
	if err != nil {
		log.Printf("[CONTEST_ACCESS] Failed to check contest access: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Contest not found"})
		return
	}

	response := ContestAccessResponse{
		ContestID:        contestID,
		CanAccess:        canAccess,
		IsRegistered:     isRegistered,
		IsPublic:         contest.IsPublic,
		RequiresPassword: contest.RequiresPassword(),
		Status:           contest.Status(),
	}

	c.JSON(http.StatusOK, response)
}
