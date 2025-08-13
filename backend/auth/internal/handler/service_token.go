package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"

	"codehustle/backend/auth/internal/config"
	"codehustle/backend/auth/internal/crypto"
	"codehustle/backend/auth/internal/repository"

	"github.com/gin-gonic/gin"
)

type serviceTokenReq struct {
	ClientID     string `json:"client_id" binding:"required"`
	ClientSecret string `json:"client_secret" binding:"required"`
}

func ServiceToken(c *gin.Context) {
	var req serviceTokenReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad_request"})
		return
	}
	sc, err := repository.FindServiceClientByID(req.ClientID)
	if err != nil || sc == nil || !sc.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_client"})
		return
	}
	h := sha256.Sum256([]byte(req.ClientSecret))
	if hex.EncodeToString(h[:]) != sc.HMACSecretHash {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_client"})
		return
	}
	_ = time.Duration(parseEnvInt("SERVICE_TOKEN_TTL_MINUTES", 15)) * time.Minute
	at, err := crypto.MintAccess(sc.ID, sc.Name, []string{"judge_worker"}, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "issue_failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"access_token": at})
}

func parseEnvInt(key string, def int) int {
	v := config.Get(key)
	if v == "" {
		return def
	}
	var i int
	_, _ = fmt.Sscanf(v, "%d", &i)
	if i <= 0 {
		return def
	}
	return i
}
