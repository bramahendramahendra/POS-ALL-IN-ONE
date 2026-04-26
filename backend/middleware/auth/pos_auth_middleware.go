package middleware

import (
	"strings"

	"permen_api/errors"
	error_helper "permen_api/helper/error"
	"permen_api/pkg/jwt"

	"github.com/gin-gonic/gin"
)

// POSBearerAuthMiddleware validates JWT for POS domain (claims: user_id, username, role).
func POSBearerAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.Error(&errors.UnauthenticatedError{Message: "Unauthenticated"})
			c.Abort()
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")

		claims, err := jwt.VerifyToken(token)
		if err != nil {
			errData := error_helper.SetError(c, "POS Auth middleware", err.Error(), error_helper.GetStackTrace(1), nil)
			c.Error(&errors.UnauthenticatedError{Message: errData})
			c.Abort()
			return
		}

		claimsMap := *claims

		userIDFloat, ok := claimsMap["user_id"].(float64)
		if !ok {
			c.Error(&errors.UnauthenticatedError{Message: "Token tidak valid: missing user_id"})
			c.Abort()
			return
		}

		c.Set("user_id", int(userIDFloat))
		c.Set("username", claimsMap["username"])
		c.Set("role", claimsMap["role"])
		c.Set("token", token)
		c.Next()
	}
}
