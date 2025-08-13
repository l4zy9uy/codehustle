package handler

import (
	"net/http"

	"codehustle/backend/auth/internal/models"
	"codehustle/backend/auth/internal/repository"
	"codehustle/backend/auth/internal/service"
	"codehustle/backend/auth/internal/utils"

	"github.com/gin-gonic/gin"
)

type loginReq struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var req loginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad_request"})
		return
	}
	res, err := service.LoginWithPassword(req.Email, req.Password)
	if err != nil {
		_ = repository.WriteAudit(&models.AuthAuditLog{Event: "login_failed", IP: c.ClientIP(), UA: c.Request.UserAgent()})
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_credentials"})
		return
	}
	utils.SetRefreshCookie(c.Writer, res.RefreshCookie, res.RefreshTTL)
	_ = repository.WriteAudit(&models.AuthAuditLog{UserID: &res.User.ID, Event: "login_success", IP: c.ClientIP(), UA: c.Request.UserAgent()})
	c.JSON(http.StatusOK, gin.H{"access_token": res.AccessToken})
}

func Refresh(c *gin.Context) {
	cookie, err := c.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no_refresh"})
		return
	}
	res, err := service.Refresh(cookie)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_refresh"})
		return
	}
	utils.SetRefreshCookie(c.Writer, res.RefreshCookie, res.RefreshTTL)
	_ = repository.WriteAudit(&models.AuthAuditLog{UserID: &res.User.ID, Event: "refresh", IP: c.ClientIP(), UA: c.Request.UserAgent()})
	c.JSON(http.StatusOK, gin.H{"access_token": res.AccessToken})
}

func Logout(c *gin.Context) {
	cookie, _ := c.Cookie("refresh_token")
	_ = service.Logout(cookie, false)
	utils.ClearRefreshCookie(c.Writer)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
