package segment

import (
	version_handler "pos_api/domain/version/handler"
	version_repo "pos_api/domain/version/repo"
	version_service "pos_api/domain/version/service"
	middleware "pos_api/middleware"
	pkgdatabase "pos_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func VersionAdminRoutes(r *gin.RouterGroup) {
	versionRepo := version_repo.NewVersionRepo(pkgdatabase.DB)
	versionSvc := version_service.NewVersionService(versionRepo)
	versionHand := version_handler.NewVersionHandler(versionSvc)

	r.POST("/version/android", middleware.RoleMiddleware("admin"), versionHand.UpdateAndroidVersion)
}
