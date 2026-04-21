package middleware

import (
	"crypto/subtle"
	"encoding/base64"
	"permen_api/errors"
	error_helper "permen_api/helper/error"
	log_helper "permen_api/helper/log"
	"strings"

	"github.com/gin-gonic/gin"
)

// CredentialValidator is a function type for validating username/password pairs.
// Return true if credentials are valid, false otherwise.
// This allows flexibility in credential storage (config, database, external service).
type CredentialValidator func(username, password string) bool

// BasicAuthConfig holds configuration for Basic Auth middleware.
type BasicAuthConfig struct {
	// Realm is the authentication realm displayed in the browser prompt.
	// Default: "Restricted"
	Realm string

	// Validator is the function to validate credentials.
	// Required field.
	Validator CredentialValidator

	// SkipPaths are paths that should bypass authentication.
	// Example: []string{"/health", "/metrics"}
	SkipPaths []string

	// LogFailedAttempts enables logging of failed authentication attempts.
	// Default: true
	LogFailedAttempts bool

	// RequireHTTPS enforces HTTPS-only access when enabled.
	// Default: false (should be true in production)
	RequireHTTPS bool
}

// BasicAuthMiddleware creates a middleware for HTTP Basic Authentication.
// Best practices implemented:
// 1. Constant-time comparison to prevent timing attacks
// 2. Proper WWW-Authenticate header on failure
// 3. Configurable credential validation (supports DB, config, external services)
// 4. Skip paths for health checks and public endpoints
// 5. Logging for security monitoring
// 6. HTTPS enforcement option
func BasicAuthMiddleware(config BasicAuthConfig) gin.HandlerFunc {
	// Set defaults
	if config.Realm == "" {
		config.Realm = "Restricted"
	}

	// Pre-compute skip paths for faster lookup
	skipPathsMap := make(map[string]bool)
	for _, path := range config.SkipPaths {
		skipPathsMap[path] = true
	}

	return func(c *gin.Context) {
		scope := "Basic Authentication"

		// Check if path should be skipped
		if skipPathsMap[c.Request.URL.Path] {
			c.Next()
			return
		}

		// Security: Optionally enforce HTTPS
		if config.RequireHTTPS && c.Request.TLS == nil && c.GetHeader("X-Forwarded-Proto") != "https" {
			log_helper.SetLog(c, "warn", scope, "HTTPS required but request is HTTP", error_helper.GetStackTrace(1), nil)
			c.Header("WWW-Authenticate", `Basic realm="`+config.Realm+`"`)
			c.Error(&errors.UnauthenticatedError{Message: "HTTPS required"})
			c.Abort()
			return
		}

		// Extract Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			handleAuthFailure(c, config, scope, "Missing Authorization header")
			return
		}

		// Validate header format
		if !strings.HasPrefix(authHeader, "Basic ") {
			handleAuthFailure(c, config, scope, "Invalid Authorization header format")
			return
		}

		// Decode base64 credentials
		encodedCredentials := strings.TrimPrefix(authHeader, "Basic ")
		decodedBytes, err := base64.StdEncoding.DecodeString(encodedCredentials)
		if err != nil {
			handleAuthFailure(c, config, scope, "Invalid base64 encoding")
			return
		}

		// Parse username:password
		credentials := string(decodedBytes)
		colonIndex := strings.Index(credentials, ":")
		if colonIndex == -1 {
			handleAuthFailure(c, config, scope, "Invalid credentials format")
			return
		}

		username := credentials[:colonIndex]
		password := credentials[colonIndex+1:]

		// Validate credentials are not empty
		if username == "" || password == "" {
			handleAuthFailure(c, config, scope, "Empty username or password")
			return
		}

		// Validate credentials using the provided validator
		if !config.Validator(username, password) {
			handleAuthFailure(c, config, scope, "Invalid credentials")
			return
		}

		// Store authenticated username in context for downstream use
		c.Set("auth_username", username)
		c.Set("auth_type", "basic")

		log_helper.SetLog(c, "info", scope, "Authentication successful", nil, map[string]string{
			"username": username,
		})

		c.Next()
	}
}

// handleAuthFailure handles authentication failures consistently.
func handleAuthFailure(c *gin.Context, config BasicAuthConfig, scope, reason string) {
	if config.LogFailedAttempts {
		log_helper.SetLog(c, "warn", scope, reason, error_helper.GetStackTrace(1), map[string]interface{}{
			"ip":         c.ClientIP(),
			"user_agent": c.GetHeader("User-Agent"),
			"path":       c.Request.URL.Path,
		})
	}

	// Set WWW-Authenticate header to prompt browser for credentials
	c.Header("WWW-Authenticate", `Basic realm="`+config.Realm+`", charset="UTF-8"`)
	c.Error(&errors.UnauthenticatedError{Message: "Authentication required"})
	c.Abort()
}

// ConstantTimeCompare performs a constant-time comparison of two strings.
// This prevents timing attacks where attackers can guess credentials
// by measuring response times.
func ConstantTimeCompare(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}

// NewStaticCredentialValidator creates a validator for a single username/password pair.
// Uses constant-time comparison to prevent timing attacks.
// Suitable for simple use cases or development environments.
func NewStaticCredentialValidator(expectedUsername, expectedPassword string) CredentialValidator {
	return func(username, password string) bool {
		usernameMatch := ConstantTimeCompare(username, expectedUsername)
		passwordMatch := ConstantTimeCompare(password, expectedPassword)
		// Both must match - using AND ensures both comparisons always run
		return usernameMatch && passwordMatch
	}
}

// NewMultiUserValidator creates a validator for multiple username/password pairs.
// Uses constant-time comparison to prevent timing attacks.
// Note: The map lookup itself may leak timing info about username existence.
// For high-security scenarios, consider using a database with constant-time lookup.
func NewMultiUserValidator(credentials map[string]string) CredentialValidator {
	return func(username, password string) bool {
		expectedPassword, exists := credentials[username]
		if !exists {
			// Still perform a comparison to maintain constant time
			// Use a dummy password to prevent timing attacks
			ConstantTimeCompare(password, "dummy_password_for_timing")
			return false
		}
		return ConstantTimeCompare(password, expectedPassword)
	}
}

// BasicAuthWithStaticCredentials is a convenience function for simple use cases.
// Creates a Basic Auth middleware with a single username/password pair.
func BasicAuthWithStaticCredentials(username, password, realm string) gin.HandlerFunc {
	return BasicAuthMiddleware(BasicAuthConfig{
		Realm:             realm,
		Validator:         NewStaticCredentialValidator(username, password),
		LogFailedAttempts: true,
	})
}

// BasicAuthWithMultiUser is a convenience function for multiple user credentials.
// Creates a Basic Auth middleware with a map of username/password pairs.
func BasicAuthWithMultiUser(credentials map[string]string, realm string) gin.HandlerFunc {
	return BasicAuthMiddleware(BasicAuthConfig{
		Realm:             realm,
		Validator:         NewMultiUserValidator(credentials),
		LogFailedAttempts: true,
	})
}
