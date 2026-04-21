package middleware

import (
	"permen_api/errors"
	error_helper "permen_api/helper/error"
	log_helper "permen_api/helper/log"
	request_helper "permen_api/helper/request"
	"permen_api/helper/security"
	"permen_api/pkg/jwt"

	"github.com/gin-gonic/gin"
	jwtLib "github.com/golang-jwt/jwt/v5"
)

// Wrapper functions to adapt JWT package functions to security helper interface
func jwtVerifyWrapper(token string) (*map[string]interface{}, error) {
	claims, err := jwt.VerifyToken(token)
	if err != nil {
		return nil, err
	}

	// Convert jwt.MapClaims to map[string]interface{}
	result := make(map[string]interface{})
	for k, v := range *claims {
		result[k] = v
	}
	return &result, nil
}

func jwtFillClaimsWrapper(claims map[string]interface{}) map[string]string {
	// Convert map[string]interface{} back to jwtLib.MapClaims
	jwtClaims := make(jwtLib.MapClaims)
	for k, v := range claims {
		jwtClaims[k] = v
	}
	return jwt.FillResultMapFromClaims(jwtClaims)
}

func BearerAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		unauthenticatedMessage := "Unauthenticated"
		logType := "warn"
		scope := "Authentication Token"

		bodyString, err := request_helper.ReadRequestBody(c)
		if err != nil {
			errData := error_helper.SetError(c, "Auth middleware, read request body", err.Error(), error_helper.GetStackTrace(1), nil)
			unauthenticatedMessage = "Unauthenticated #1: " + err.Error()
			c.Error(&errors.InternalServerError{Message: errData})
			c.Abort()
			return
		}
		log_helper.SetLog(c, "info", "Auth middleware", "Read request body", nil, bodyString)

		// Security: Use centralized authentication validation
		authResult, err := security.ValidateAuthentication(c, jwtVerifyWrapper, jwtFillClaimsWrapper)
		if err != nil {
			log_helper.SetLog(c, logType, scope, err.Error(), error_helper.GetStackTrace(1), nil)
			unauthenticatedMessage = "Unauthenticated #2: " + err.Error()
			c.Error(&errors.UnauthenticatedError{Message: unauthenticatedMessage})
			c.Abort()
			return
		}

		// Set userq header from validated auth result
		c.Request.Header.Set("userq", authResult.UserqHeader)

		// Set additional headers from claims (already validated by helper)
		for key, value := range authResult.HeadersToSet {
			c.Request.Header.Set(key, value)
		}
		c.Set("claims", authResult.Claims)
		c.Next()
	}
}
