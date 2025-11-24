package repository

import (
	"log"
	"time"

	"codehustle/backend/internal/db"
	"codehustle/backend/internal/models"
)

// ListAnnouncementsResponse represents a paginated list of announcements
type ListAnnouncementsResponse struct {
	Items    []AnnouncementListItem `json:"items"`
	Total    int64                  `json:"total"`
	Page     int                    `json:"page"`
	PageSize int                    `json:"page_size"`
}

// AnnouncementListItem represents a single announcement in the list
type AnnouncementListItem struct {
	ID           string     `json:"id"`
	Title        string     `json:"title"`
	Snippet      string     `json:"snippet"`
	Content      string     `json:"content"`
	Author       string     `json:"author"`
	Date         time.Time  `json:"date"`
	Image        *string    `json:"image,omitempty"`
	Read         bool       `json:"read"`
	VisibleUntil *time.Time `json:"visible_until,omitempty"`
}

// ListAnnouncements returns paginated announcements
func ListAnnouncements(userID string, page, pageSize int, query string) (*ListAnnouncementsResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10 // Default page size
	}
	if pageSize > 100 {
		pageSize = 100 // Max page size
	}

	offset := (page - 1) * pageSize
	now := time.Now()

	// Build base query - exclude soft deleted and expired announcements
	countQuery := db.DB.Model(&models.Announcement{}).
		Where("deleted_at IS NULL").
		Where("(visible_until IS NULL OR visible_until >= ?)", now)

	// Apply search query if provided
	if query != "" {
		countQuery = countQuery.Where("title LIKE ? OR content LIKE ? OR snippet LIKE ?", "%"+query+"%", "%"+query+"%", "%"+query+"%")
	}

	// Get total count
	var total int64
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, err
	}

	// Build query for fetching announcements with pagination
	fetchQuery := db.DB.Model(&models.Announcement{}).
		Where("deleted_at IS NULL").
		Where("(visible_until IS NULL OR visible_until >= ?)", now)

	// Apply search query if provided
	if query != "" {
		fetchQuery = fetchQuery.Where("title LIKE ? OR content LIKE ? OR snippet LIKE ?", "%"+query+"%", "%"+query+"%", "%"+query+"%")
	}

	// Get paginated announcements ordered by created_at DESC
	var announcements []models.Announcement
	if err := fetchQuery.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&announcements).Error; err != nil {
		return nil, err
	}

	log.Printf("[REPO] ListAnnouncements: page=%d, pageSize=%d, offset=%d, total=%d, returned=%d", page, pageSize, offset, total, len(announcements))

	// Get read status for user if userID is provided
	readMap := make(map[string]bool)
	if userID != "" {
		var announcementIDs []string
		for _, ann := range announcements {
			announcementIDs = append(announcementIDs, ann.ID)
		}

		if len(announcementIDs) > 0 {
			var reads []models.AnnouncementRead
			db.DB.Where("user_id = ? AND announcement_id IN ?", userID, announcementIDs).Find(&reads)
			for _, read := range reads {
				readMap[read.AnnouncementID] = true
			}
		}
	}

	// Build response
	items := make([]AnnouncementListItem, len(announcements))
	for i, ann := range announcements {
		items[i] = AnnouncementListItem{
			ID:           ann.ID,
			Title:        ann.Title,
			Snippet:      ann.Snippet,
			Content:      ann.Content,
			Author:       ann.Author,
			Date:         ann.CreatedAt,
			Image:        ann.Image,
			Read:         readMap[ann.ID],
			VisibleUntil: ann.VisibleUntil,
		}
	}

	return &ListAnnouncementsResponse{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

// GetAnnouncement retrieves an announcement by ID
func GetAnnouncement(announcementID string, userID string) (*models.Announcement, bool, error) {
	now := time.Now()
	var announcement models.Announcement
	err := db.DB.Where("id = ? AND deleted_at IS NULL AND (visible_until IS NULL OR visible_until >= ?)", announcementID, now).
		First(&announcement).Error
	if err != nil {
		return nil, false, err
	}

	// Check read status
	isRead := false
	if userID != "" {
		var read models.AnnouncementRead
		err := db.DB.Where("user_id = ? AND announcement_id = ?", userID, announcementID).First(&read).Error
		if err == nil {
			isRead = true
		}
	}

	return &announcement, isRead, nil
}

// CreateAnnouncement inserts a new announcement
func CreateAnnouncement(announcement *models.Announcement) error {
	return db.DB.Create(announcement).Error
}

// UpdateAnnouncement updates an existing announcement
func UpdateAnnouncement(announcement *models.Announcement) error {
	// Use Select to update all fields including zero values
	return db.DB.Model(announcement).
		Select("title", "snippet", "content", "author", "image", "visible_until", "updated_at").
		Updates(announcement).Error
}

// DeleteAnnouncement performs a soft delete on an announcement
func DeleteAnnouncement(announcementID string) error {
	now := time.Now()
	return db.DB.Model(&models.Announcement{}).
		Where("id = ?", announcementID).
		Update("deleted_at", now).Error
}

// MarkAnnouncementRead marks an announcement as read for a user
func MarkAnnouncementRead(userID, announcementID string) error {
	read := models.AnnouncementRead{
		UserID:         userID,
		AnnouncementID: announcementID,
	}
	// Use ON DUPLICATE KEY UPDATE to handle existing reads
	return db.DB.Where("user_id = ? AND announcement_id = ?", userID, announcementID).
		FirstOrCreate(&read).Error
}

// MarkAnnouncementUnread removes the read status for a user
func MarkAnnouncementUnread(userID, announcementID string) error {
	return db.DB.Where("user_id = ? AND announcement_id = ?", userID, announcementID).
		Delete(&models.AnnouncementRead{}).Error
}
