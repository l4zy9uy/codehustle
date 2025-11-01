package utils

import (
	"regexp"
	"strings"
)

// GenerateSlug converts a title to a URL-friendly slug
// It removes special characters, converts to lowercase, and replaces spaces with hyphens
func GenerateSlug(title string) string {
	// Convert to lowercase
	slug := strings.ToLower(title)

	// Remove special characters except spaces and hyphens
	reg := regexp.MustCompile(`[^\w\s-]`)
	slug = reg.ReplaceAllString(slug, "")

	// Replace multiple spaces/hyphens with single hyphen
	reg = regexp.MustCompile(`[-\s]+`)
	slug = reg.ReplaceAllString(slug, "-")

	// Trim hyphens from start and end
	slug = strings.Trim(slug, "-")

	return slug
}
