package repository

import (
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/models"
	"codehustle/backend/internal/utils"
	"fmt"
)

// ListProblems returns all problems (optionally filtered by is_public)
func ListProblems(isPublicOnly bool) ([]models.Problem, error) {
	var problems []models.Problem
	query := db.DB.Model(&models.Problem{})

	if isPublicOnly {
		query = query.Where("is_public = ?", 1)
	}

	err := query.Find(&problems).Error
	return problems, err
}

// GetProblem retrieves a problem by ID or slug
func GetProblem(identifier string) (*models.Problem, error) {
	var problem models.Problem
	// Try to find by slug first (slugs are typically shorter and don't contain hyphens like UUIDs)
	// If not found, try by ID
	err := db.DB.Where("slug = ? OR id = ?", identifier, identifier).First(&problem).Error
	if err != nil {
		return nil, err
	}
	return &problem, nil
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
			err := db.DB.Where("slug = ?", p.Slug).First(&existing).Error
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
