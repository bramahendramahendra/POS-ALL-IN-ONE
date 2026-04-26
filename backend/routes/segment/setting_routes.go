package segment

import (
	setting_handler "permen_api/domain/setting/handler"
	setting_repo "permen_api/domain/setting/repo"
	setting_service "permen_api/domain/setting/service"
	middleware "permen_api/middleware"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func SettingRoutes(r *gin.RouterGroup) {
	settingRepo := setting_repo.NewSettingRepo(pkgdatabase.DB)
	settingSvc := setting_service.NewSettingService(settingRepo)
	settingHand := setting_handler.NewSettingHandler(settingSvc)

	g := r.Group("/settings")
	{
		g.GET("", settingHand.GetAll)
		g.GET("/:key", settingHand.GetByKey)
		g.POST("", middleware.RoleMiddleware("owner", "admin"), settingHand.Save)
		g.POST("/reset", middleware.RoleMiddleware("admin"), settingHand.Reset)
	}
}
