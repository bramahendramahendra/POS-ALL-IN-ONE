package segment

import (
	version_handler "permen_api/domain/version/handler"
	version_repo "permen_api/domain/version/repo"
	version_service "permen_api/domain/version/service"
	middleware "permen_api/middleware"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func VersionAdminRoutes(r *gin.RouterGroup) {
	versionRepo := version_repo.NewVersionRepo(pkgdatabase.DB)
	versionSvc := version_service.NewVersionService(versionRepo)
	versionHand := version_handler.NewVersionHandler(versionSvc)

	r.POST("/version/android", middleware.RoleMiddleware("admin"), versionHand.UpdateAndroidVersion)
}
