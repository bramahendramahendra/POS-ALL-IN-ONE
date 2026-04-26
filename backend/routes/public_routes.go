package routes

import (
	auth_handler "permen_api/domain/auth/handler"
	auth_repo "permen_api/domain/auth/repo"
	auth_service "permen_api/domain/auth/service"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func publicRoutes(r *gin.RouterGroup) {
	authRepo := auth_repo.NewAuthRepo(pkgdatabase.DB)
	authSvc := auth_service.NewAuthService(authRepo)
	authHand := auth_handler.NewAuthHandler(authSvc)

	authGroup := r.Group("/auth")
	authGroup.POST("/login", authHand.Login)
	authGroup.POST("/refresh", authHand.RefreshToken)
}
