package middleware

import (
	"strings"

	"permen_api/errors"
	service_auth "permen_api/domain/auth/service"

	"github.com/gin-gonic/gin"
)

// POSBearerAuthMiddleware validates JWT + single active session via sessions table.
func POSBearerAuthMiddleware(authService service_auth.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.Error(&errors.UnauthenticatedError{Message: "Token tidak ditemukan"})
			c.Abort()
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")

		session, err := authService.ValidateToken(token)
		if err != nil {
			c.Error(&errors.UnauthenticatedError{Message: err.Error()})
			c.Abort()
			return
		}

		c.Set("user_id", session.UserID)
		c.Set("user_role", session.UserRole)
		c.Set("device_info", session.DeviceInfo)
		c.Set("token", token)

		c.Next()
	}
}
