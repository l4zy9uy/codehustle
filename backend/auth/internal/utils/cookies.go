package utils

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"codehustle/backend/auth/internal/config"
)

func SetRefreshCookie(w http.ResponseWriter, value string, ttl time.Duration) {
	secure := strings.ToLower(config.Get("COOKIE_SECURE")) == "true"
	domain := config.Get("COOKIE_DOMAIN")
	sameSite := parseSameSite(config.Get("COOKIE_SAMESITE"))

	c := &http.Cookie{
		Name:     "refresh_token",
		Value:    value,
		Path:     "/",
		Domain:   domain,
		MaxAge:   int(ttl.Seconds()),
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
	}
	http.SetCookie(w, c)
}

func ClearRefreshCookie(w http.ResponseWriter) {
	secure := strings.ToLower(config.Get("COOKIE_SECURE")) == "true"
	domain := config.Get("COOKIE_DOMAIN")
	c := &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		Domain:   domain,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, c)
}

func parseSameSite(v string) http.SameSite {
	switch strings.ToLower(v) {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	default:
		return http.SameSiteLaxMode
	}
}

func ParseIntEnv(key string, def int) int {
	s := config.Get(key)
	if s == "" {
		return def
	}
	i, err := strconv.Atoi(s)
	if err != nil || i <= 0 {
		return def
	}
	return i
}
