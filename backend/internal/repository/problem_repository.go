package repository

import (
	"fmt"
	"time"

	"codehustle/backend/internal/db"
	"codehustle/backend/internal/models"
	"codehustle/backend/internal/utils"
)

// ListProblems returns all problems (optionally filtered by is_public)
func ListProblems(isPublicOnly bool) ([]models.Problem, error) {
	var problems []models.Problem
	query := db.DB.Model(&models.Problem{}).Where("deleted_at IS NULL")

	if isPublicOnly {
		query = query.Where("is_public = ?", 1)
	}

	err := query.Find(&problems).Error
	return problems, err
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
