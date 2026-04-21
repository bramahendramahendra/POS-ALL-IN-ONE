package middleware

import (
	"permen_api/config"

	"github.com/gin-gonic/gin"
)

// SecurityHeaders adds essential security headers to all responses
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// HSTS (HTTP Strict Transport Security) - Force HTTPS for 1 year
		// This prevents protocol downgrade attacks and cookie hijacking
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")

		// X-Content-Type-Options - Prevent MIME type sniffing
		c.Header("X-Content-Type-Options", "nosniff")

		// X-Frame-Options - Prevent clickjacking attacks
		c.Header("X-Frame-Options", "DENY")

		// X-XSS-Protection - Enable browser XSS protection
		c.Header("X-XSS-Protection", "1; mode=block")

		// Referrer-Policy - Control referrer information
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Content-Security-Policy - Prevent XSS and injection attacks
		// Adjust connect-src based on environment
		connectSrc := "'self' https:"
		if config.ENV.ReleaseMode == "local" || config.ENV.ReleaseMode == "dev" {
			connectSrc = "'self' http: https:"
		}

		csp := "default-src 'self'; " +
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
			"style-src 'self' 'unsafe-inline'; " +
			"img-src 'self' data: https:; " +
			"font-src 'self'; " +
			"connect-src " + connectSrc + "; " +
			"media-src 'self'; " +
			"object-src 'none'; " +
			"frame-src 'none'; " +
			"base-uri 'self'; " +
			"form-action 'self'"
		c.Header("Content-Security-Policy", csp)

		// Permissions-Policy - Control browser features
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

		// Remove server information disclosure
		c.Header("Server", "")

		c.Next()
	}
}
