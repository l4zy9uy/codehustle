package handler

import (
	"encoding/base64"
	"encoding/binary"
	"net/http"

	"codehustle/backend/auth/internal/crypto"

	"github.com/gin-gonic/gin"
)

type jwk struct {
	Kty string `json:"kty"`
	Alg string `json:"alg"`
	Use string `json:"use"`
	Kid string `json:"kid"`
	N   string `json:"n"`
	E   string `json:"e"`
}

type jwks struct {
	Keys []jwk `json:"keys"`
}

func Jwks(c *gin.Context) {
	ks, err := crypto.Current()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "keys_unavailable"})
		return
	}
	n := base64.RawURLEncoding.EncodeToString(ks.Pub.N.Bytes())
	e := uintToBase64(uint64(ks.Pub.E))

	resp := jwks{
		Keys: []jwk{{
			Kty: "RSA",
			Alg: "RS256",
			Use: "sig",
			Kid: ks.ActiveKID,
			N:   n,
			E:   e,
		}},
	}
	c.JSON(http.StatusOK, resp)
}

func uintToBase64(i uint64) string {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, i)
	b = trimLeadingZeros(b)
	return base64.RawURLEncoding.EncodeToString(b)
}

func trimLeadingZeros(b []byte) []byte {
	for i := 0; i < len(b); i++ {
		if b[i] != 0 {
			return b[i:]
		}
	}
	return []byte{0}
}
