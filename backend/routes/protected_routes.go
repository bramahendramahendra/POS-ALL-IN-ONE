package routes

import (
	auth_handler "permen_api/domain/auth/handler"
	auth_repo "permen_api/domain/auth/repo"
	auth_service "permen_api/domain/auth/service"
	pos_middleware "permen_api/middleware/auth"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func protectedRoutes(r *gin.RouterGroup) {
	authRepo := auth_repo.NewAuthRepo(pkgdatabase.DB)
	authSvc := auth_service.NewAuthService(authRepo)
	authHand := auth_handler.NewAuthHandler(authSvc)

	r.Use(pos_middleware.POSBearerAuthMiddleware(authSvc))

	r.GET("/auth/me", authHand.GetMe)
	r.POST("/auth/logout", authHand.Logout)
}
