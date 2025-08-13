package service

import "codehustle/backend/auth/internal/models"

func IssueForLinkedUser(u *models.User) (*LoginResult, error) {
	return issueTokensForUser(u, true, "")
}
