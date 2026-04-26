package middleware

import (
	"permen_api/errors"

	"github.com/gin-gonic/gin"
)

// RoleMiddleware restricts access to the specified roles.
// Usage: RoleMiddleware("owner", "admin")
func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("user_role")
		if !exists {
			c.Error(&errors.UnauthenticatedError{Message: "Unauthorized"})
			c.Abort()
			return
		}

		userRole := role.(string)
		for _, allowed := range allowedRoles {
			if userRole == allowed {
				c.Next()
				return
			}
		}

		c.Error(&errors.UnauthorizededError{Message: "Anda tidak memiliki akses ke fitur ini"})
		c.Abort()
	}
}
