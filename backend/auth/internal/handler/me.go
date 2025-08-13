package handler

import (
	"net/http"

	"codehustle/backend/auth/internal/crypto"

	"github.com/gin-gonic/gin"
)

func Me(c *gin.Context) {
	v, _ := c.Get("claims")
	cl := v.(*crypto.AccessClaims)
	c.JSON(http.StatusOK, gin.H{
		"id":    cl.Sub,
		"email": cl.Email,
		"roles": cl.Roles,
	})
}
