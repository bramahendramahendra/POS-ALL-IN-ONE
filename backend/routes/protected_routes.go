package routes

import (
	auth_middleware "permen_api/middleware/auth"

	"github.com/gin-gonic/gin"
)

func protectedRoutes(r *gin.RouterGroup) {
	r.Use(auth_middleware.BearerAuthMiddleware())

}
