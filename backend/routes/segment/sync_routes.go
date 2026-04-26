package segment

import (
	sync_handler "permen_api/domain/sync/handler"
	sync_repo "permen_api/domain/sync/repo"
	sync_service "permen_api/domain/sync/service"
	middleware "permen_api/middleware"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func SyncRoutes(r *gin.RouterGroup) {
	syncRepo := sync_repo.NewSyncRepo(pkgdatabase.DB)
	syncSvc := sync_service.NewSyncService(syncRepo)
	syncHand := sync_handler.NewSyncHandler(syncSvc)

	g := r.Group("/sync")
	{
		g.GET("/conflicts", middleware.RoleMiddleware("owner", "admin"), syncHand.GetConflicts)
		g.POST("/conflicts/:id/resolve", middleware.RoleMiddleware("owner", "admin"), syncHand.ResolveConflict)
		g.GET("/queue", middleware.RoleMiddleware("owner", "admin"), syncHand.GetQueue)
		g.GET("/history", middleware.RoleMiddleware("owner", "admin"), syncHand.GetHistory)
		g.POST("/push", syncHand.PushSync)
	}
}
