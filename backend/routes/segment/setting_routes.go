package segment

import (
	setting_handler "pos_api/domain/setting/handler"
	setting_repo "pos_api/domain/setting/repo"
	setting_service "pos_api/domain/setting/service"
	middleware "pos_api/middleware"
	pkgdatabase "pos_api/pkg/database"

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
