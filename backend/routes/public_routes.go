package routes

import (
	auth_handler "permen_api/domain/auth/handler"
	auth_repo "permen_api/domain/auth/repo"
	auth_service "permen_api/domain/auth/service"
	version_handler "permen_api/domain/version/handler"
	version_repo "permen_api/domain/version/repo"
	version_service "permen_api/domain/version/service"
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

	// Version Check (public — dipanggil sebelum login)
	versionRepoInst := version_repo.NewVersionRepo(pkgdatabase.DB)
	versionSvc := version_service.NewVersionService(versionRepoInst)
	versionHand := version_handler.NewVersionHandler(versionSvc)

	r.GET("/version/android", versionHand.CheckAndroid)
}
