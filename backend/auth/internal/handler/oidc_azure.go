package handler

import (
	"context"
	"net/http"

	"codehustle/backend/auth/internal/models"
	"codehustle/backend/auth/internal/repository"
	"codehustle/backend/auth/internal/service"
	"codehustle/backend/auth/internal/utils"

	"github.com/gin-gonic/gin"
)

func AzureStart(c *gin.Context) {
	oidcSvc, err := service.NewAzureOIDC(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "oidc_unavailable"})
		return
	}
	url, _ := oidcSvc.Start("state")
	c.Redirect(http.StatusFound, url)
}

func AzureCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing_code"})
		return
	}
	oidcSvc, err := service.NewAzureOIDC(context.Background())
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "oidc_unavailable"})
		return
	}
	profile, err := oidcSvc.Callback(context.Background(), code)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "oidc_invalid"})
		return
	}
	u, err := service.LinkOrCreateAzureUser(profile)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "link_failed"})
		return
	}
	res, err := service.IssueForLinkedUser(u)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "issue_failed"})
		return
	}
	utils.SetRefreshCookie(c.Writer, res.RefreshCookie, res.RefreshTTL)
	_ = repository.WriteAudit(&models.AuthAuditLog{UserID: &u.ID, Event: "login_oidc", IP: c.ClientIP(), UA: c.Request.UserAgent()})
	c.JSON(http.StatusOK, gin.H{"access_token": res.AccessToken})
}
