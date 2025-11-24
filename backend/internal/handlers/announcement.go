package handlers

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"codehustle/backend/internal/constants"
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/middleware"
	"codehustle/backend/internal/models"
	"codehustle/backend/internal/repository"
)

// ListAnnouncements returns a paginated list of announcements
func ListAnnouncements(c *gin.Context) {
	// Get pagination parameters
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")
	query := c.Query("q")

	pageNum, err := strconv.Atoi(page)
	if err != nil || pageNum < 1 {
		pageNum = 1
	}

	pageSizeNum, err := strconv.Atoi(pageSize)
	if err != nil || pageSizeNum < 1 {
		pageSizeNum = 10
	}
	if pageSizeNum > 100 {
		pageSizeNum = 100
	}

	// Get user context for read status
	userID := ""
	userCtx, exists := c.Get("user")
	if exists {
		if userCtxVal, ok := userCtx.(middleware.UserContext); ok {
			userID = userCtxVal.ID
		}
	}

	log.Printf("[ANNOUNCEMENT] ListAnnouncements: page=%d, pageSize=%d, query=%s", pageNum, pageSizeNum, query)

	result, err := repository.ListAnnouncements(userID, pageNum, pageSizeNum, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_fetch_announcements",
			"message": err.Error(),
		})
		return
	}

	log.Printf("[ANNOUNCEMENT] ListAnnouncements response: total=%d, returned=%d", result.Total, len(result.Items))
	c.JSON(http.StatusOK, result)
}

// GetAnnouncement returns a single announcement by ID
func GetAnnouncement(c *gin.Context) {
	announcementID := c.Param("id")
	if announcementID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_announcement_id"})
		return
	}

	// Get user context for read status
	userID := ""
	userCtx, exists := c.Get("user")
	if exists {
		if userCtxVal, ok := userCtx.(middleware.UserContext); ok {
			userID = userCtxVal.ID
		}
	}

	announcement, isRead, err := repository.GetAnnouncement(announcementID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "announcement_not_found",
			"message": err.Error(),
		})
		return
	}

	// Build response matching API contract
	response := gin.H{
		"id":            announcement.ID,
		"title":         announcement.Title,
		"snippet":       announcement.Snippet,
		"content":       announcement.Content,
		"author":        announcement.Author,
		"date":          announcement.CreatedAt,
		"image":         announcement.Image,
		"read":          isRead,
		"visible_until": announcement.VisibleUntil,
	}

	c.JSON(http.StatusOK, response)
}

// CreateAnnouncementRequest represents the expected payload for creating an announcement
type CreateAnnouncementRequest struct {
	Title        string     `json:"title" binding:"required"`
	Snippet      string     `json:"snippet"`
	Content      string     `json:"content" binding:"required"`
	Author       string     `json:"author"`
	Image        *string    `json:"image"`
	VisibleUntil *time.Time `json:"visible_until"`
}

// CreateAnnouncement creates a new announcement (admin only)
func CreateAnnouncement(c *gin.Context) {
	var req CreateAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user context
	userCtx, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing_user_context"})
		return
	}

	userCtxVal, ok := userCtx.(middleware.UserContext)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_user_context"})
		return
	}

	// Check authorization: must be admin
	if !constants.HasAnyRole(userCtxVal.Roles, constants.AdminRoles) {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient_permissions"})
		return
	}

	// Get author name from user if not provided
	author := req.Author
	if author == "" {
		// Try to get from user's first/last name
		var user models.User
		if err := db.DB.Where("id = ?", userCtxVal.ID).First(&user).Error; err == nil {
			if user.FirstName != "" || user.LastName != "" {
				author = user.FirstName + " " + user.LastName
			} else {
				author = user.Email
			}
		}
	}

	announcementID := uuid.NewString()
	announcement := models.Announcement{
		ID:           announcementID,
		Title:        req.Title,
		Snippet:      req.Snippet,
		Content:      req.Content,
		Author:       author,
		Image:        req.Image,
		CreatedBy:    userCtxVal.ID,
		VisibleUntil: req.VisibleUntil,
	}

	if err := repository.CreateAnnouncement(&announcement); err != nil {
		log.Printf("[ANNOUNCEMENT] Failed to create announcement: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_create_announcement",
			"message": err.Error(),
		})
		return
	}

	log.Printf("[ANNOUNCEMENT] Created announcement '%s' (ID: %s) by user %s", announcement.Title, announcement.ID, userCtxVal.ID)

	// Return created announcement
	response := gin.H{
		"id":            announcement.ID,
		"title":         announcement.Title,
		"snippet":       announcement.Snippet,
		"content":       announcement.Content,
		"author":        announcement.Author,
		"date":          announcement.CreatedAt,
		"updated_at":    announcement.UpdatedAt,
		"image":         announcement.Image,
		"visible_until": announcement.VisibleUntil,
	}

	c.JSON(http.StatusCreated, response)
}

// UpdateAnnouncementRequest represents the expected payload for updating an announcement
type UpdateAnnouncementRequest struct {
	Title        *string    `json:"title"`
	Snippet      *string    `json:"snippet"`
	Content      *string    `json:"content"`
	Author       *string    `json:"author"`
	Image        *string    `json:"image"`
	VisibleUntil *time.Time `json:"visible_until"`
}

// UpdateAnnouncement updates an existing announcement (admin only)
func UpdateAnnouncement(c *gin.Context) {
	announcementID := c.Param("id")
	if announcementID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_announcement_id"})
		return
	}

	// Get user context
	userCtx, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing_user_context"})
		return
	}

	userCtxVal, ok := userCtx.(middleware.UserContext)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_user_context"})
		return
	}

	// Check authorization: must be admin
	if !constants.HasAnyRole(userCtxVal.Roles, constants.AdminRoles) {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient_permissions"})
		return
	}

	// Get existing announcement
	existingAnnouncement, _, err := repository.GetAnnouncement(announcementID, "")
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "announcement_not_found",
			"message": err.Error(),
		})
		return
	}

	var req UpdateAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields if provided
	if req.Title != nil {
		existingAnnouncement.Title = *req.Title
	}
	if req.Snippet != nil {
		existingAnnouncement.Snippet = *req.Snippet
	}
	if req.Content != nil {
		existingAnnouncement.Content = *req.Content
	}
	if req.Author != nil {
		existingAnnouncement.Author = *req.Author
	}
	if req.Image != nil {
		existingAnnouncement.Image = req.Image
	}
	if req.VisibleUntil != nil {
		existingAnnouncement.VisibleUntil = req.VisibleUntil
	}

	if err := repository.UpdateAnnouncement(existingAnnouncement); err != nil {
		log.Printf("[ANNOUNCEMENT] Failed to update announcement: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_update_announcement",
			"message": err.Error(),
		})
		return
	}

	log.Printf("[ANNOUNCEMENT] Updated announcement '%s' (ID: %s) by user %s", existingAnnouncement.Title, existingAnnouncement.ID, userCtxVal.ID)

	// Return updated announcement
	response := gin.H{
		"id":            existingAnnouncement.ID,
		"title":         existingAnnouncement.Title,
		"snippet":       existingAnnouncement.Snippet,
		"content":       existingAnnouncement.Content,
		"author":        existingAnnouncement.Author,
		"date":          existingAnnouncement.CreatedAt,
		"updated_at":    existingAnnouncement.UpdatedAt,
		"image":         existingAnnouncement.Image,
		"visible_until": existingAnnouncement.VisibleUntil,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteAnnouncement deletes an announcement (soft delete, admin only)
func DeleteAnnouncement(c *gin.Context) {
	announcementID := c.Param("id")
	if announcementID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_announcement_id"})
		return
	}

	// Get user context
	userCtx, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing_user_context"})
		return
	}

	userCtxVal, ok := userCtx.(middleware.UserContext)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_user_context"})
		return
	}

	// Check authorization: must be admin
	if !constants.HasAnyRole(userCtxVal.Roles, constants.AdminRoles) {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient_permissions"})
		return
	}

	// Check if announcement exists
	_, _, err := repository.GetAnnouncement(announcementID, "")
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "announcement_not_found",
			"message": err.Error(),
		})
		return
	}

	if err := repository.DeleteAnnouncement(announcementID); err != nil {
		log.Printf("[ANNOUNCEMENT] Failed to delete announcement: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed_to_delete_announcement",
			"message": err.Error(),
		})
		return
	}

	log.Printf("[ANNOUNCEMENT] Deleted announcement (ID: %s) by user %s", announcementID, userCtxVal.ID)
	c.Status(http.StatusNoContent)
}

// MarkAnnouncementReadRequest represents the expected payload for marking announcement as read/unread
type MarkAnnouncementReadRequest struct {
	Status string `json:"status" binding:"required,oneof=read unread"`
}

// MarkAnnouncementRead marks an announcement as read or unread for the current user
func MarkAnnouncementRead(c *gin.Context) {
	announcementID := c.Param("id")
	if announcementID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_announcement_id"})
		return
	}

	// Get user context
	userCtx, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing_user_context"})
		return
	}

	userCtxVal, ok := userCtx.(middleware.UserContext)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_user_context"})
		return
	}

	var req MarkAnnouncementReadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if announcement exists
	_, _, err := repository.GetAnnouncement(announcementID, "")
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "announcement_not_found",
			"message": err.Error(),
		})
		return
	}

	if req.Status == "read" {
		if err := repository.MarkAnnouncementRead(userCtxVal.ID, announcementID); err != nil {
			log.Printf("[ANNOUNCEMENT] Failed to mark announcement as read: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "failed_to_mark_read",
				"message": err.Error(),
			})
			return
		}
	} else if req.Status == "unread" {
		if err := repository.MarkAnnouncementUnread(userCtxVal.ID, announcementID); err != nil {
			log.Printf("[ANNOUNCEMENT] Failed to mark announcement as unread: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "failed_to_mark_unread",
				"message": err.Error(),
			})
			return
		}
	}

	response := gin.H{
		"id":     announcementID,
		"status": req.Status,
	}

	c.JSON(http.StatusOK, response)
}
