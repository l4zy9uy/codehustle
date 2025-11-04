package repository

import (
	"fmt"
	"log"
	"time"

	"codehustle/backend/internal/db"
	"codehustle/backend/internal/models"
	"codehustle/backend/internal/utils"
)

// ListProblemsResponse represents a paginated list of problems with tags
type ListProblemsResponse struct {
	Problems []ProblemListItem `json:"problems"`
	Total    int64             `json:"total"`
	Page     int               `json:"page"`
	PageSize int               `json:"page_size"`
}

// ProblemListItem represents a single problem in the list
type ProblemListItem struct {
	Slug string   `json:"slug"`
	Name string   `json:"name"`
	Tags []string `json:"tags"`
	Diff string   `json:"diff"`
}

// ListProblems returns paginated problems with tags
func ListProblems(isPublicOnly bool, page, pageSize int) (*ListProblemsResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 25 // Default page size
	}
	if pageSize > 100 {
		pageSize = 100 // Max page size
	}

	offset := (page - 1) * pageSize

	// Build base query for counting
	countQuery := db.DB.Model(&models.Problem{}).Where("deleted_at IS NULL")
	if isPublicOnly {
		countQuery = countQuery.Where("is_public = ?", 1)
	}

	// Get total count
	var total int64
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, err
	}

	// Build query for fetching problems with pagination
	query := db.DB.Model(&models.Problem{}).Where("deleted_at IS NULL")
	if isPublicOnly {
		query = query.Where("is_public = ?", 1)
	}

	// Get paginated problems - ensure Offset and Limit are applied
	var problems []models.Problem
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&problems).Error; err != nil {
		return nil, err
	}

	log.Printf("[REPO] ListProblems: page=%d, pageSize=%d, offset=%d, total=%d, returned=%d", page, pageSize, offset, total, len(problems))

	// Load tags for each problem
	problemIDs := make([]string, len(problems))
	for i, p := range problems {
		problemIDs[i] = p.ID
	}

	// Query problem tags with tag names
	type ProblemTag struct {
		ProblemID string
		TagName   string
	}
	var problemTags []ProblemTag
	if len(problemIDs) > 0 {
		db.DB.Raw(`
			SELECT pt.problem_id, t.name as tag_name
			FROM problem_tags pt
			INNER JOIN tags t ON pt.tag_id = t.id
			WHERE pt.problem_id IN ?
		`, problemIDs).Scan(&problemTags)
	}

	// Map tags to problems
	tagsMap := make(map[string][]string)
	for _, pt := range problemTags {
		tagsMap[pt.ProblemID] = append(tagsMap[pt.ProblemID], pt.TagName)
	}

	// Build response
	items := make([]ProblemListItem, len(problems))
	for i, p := range problems {
		tags := tagsMap[p.ID]
		if tags == nil {
			tags = []string{}
		}
		items[i] = ProblemListItem{
			Slug: p.Slug,
			Name: p.Title,
			Tags: tags,
			Diff: p.Difficulty,
		}
	}

	return &ListProblemsResponse{
		Problems: items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

// GetProblem retrieves a problem by ID or slug
func GetProblem(identifier string) (*models.Problem, error) {
	var problem models.Problem
	err := db.DB.Where("(slug = ? OR id = ?) AND deleted_at IS NULL", identifier, identifier).First(&problem).Error
	if err != nil {
		return nil, err
	}
	return &problem, nil
}

// GetProblemWithTags retrieves a problem with its tags
func GetProblemWithTags(identifier string) (*models.Problem, []string, error) {
	var problem models.Problem
	err := db.DB.Where("(slug = ? OR id = ?) AND deleted_at IS NULL", identifier, identifier).First(&problem).Error
	if err != nil {
		return nil, nil, err
	}

	// Load tags
	var tagNames []string
	db.DB.Raw(`
		SELECT t.name
		FROM problem_tags pt
		INNER JOIN tags t ON pt.tag_id = t.id
		WHERE pt.problem_id = ?
	`, problem.ID).Scan(&tagNames)

	if tagNames == nil {
		tagNames = []string{}
	}

	return &problem, tagNames, nil
}

// CreateProblem inserts a new problem and generates a slug from the title if not provided
func CreateProblem(p *models.Problem) error {
	// Generate slug from title if not provided
	if p.Slug == "" {
		p.Slug = utils.GenerateSlug(p.Title)

		// Ensure uniqueness by appending a number if slug already exists
		baseSlug := p.Slug
		counter := 1
		for {
			var existing models.Problem
			err := db.DB.Where("slug = ? AND deleted_at IS NULL", p.Slug).First(&existing).Error
			if err != nil {
				// Slug doesn't exist, we can use it
				break
			}
			// Slug exists, try with a number suffix
			p.Slug = fmt.Sprintf("%s-%d", baseSlug, counter)
			counter++

			// Safety check to avoid infinite loop
			if counter > 1000 {
				return fmt.Errorf("failed to generate unique slug for problem: %s", p.Title)
			}
		}
	}

	return db.DB.Create(p).Error
}

// UpdateProblem updates an existing problem
func UpdateProblem(p *models.Problem) error {
	// Generate slug from title if slug is being updated and is empty
	if p.Slug == "" && p.Title != "" {
		p.Slug = utils.GenerateSlug(p.Title)

		// Ensure uniqueness (excluding current problem)
		baseSlug := p.Slug
		counter := 1
		for {
			var existing models.Problem
			err := db.DB.Where("slug = ? AND id != ? AND deleted_at IS NULL", p.Slug, p.ID).First(&existing).Error
			if err != nil {
				// Slug doesn't exist or is the same problem, we can use it
				break
			}
			// Slug exists for another problem, try with a number suffix
			p.Slug = fmt.Sprintf("%s-%d", baseSlug, counter)
			counter++

			if counter > 1000 {
				return fmt.Errorf("failed to generate unique slug for problem: %s", p.Title)
			}
		}
	}

	return db.DB.Model(p).Updates(p).Error
}

// DeleteProblem performs a soft delete on a problem
func DeleteProblem(problemID string) error {
	now := time.Now()
	return db.DB.Model(&models.Problem{}).
		Where("id = ?", problemID).
		Update("deleted_at", now).Error
}
