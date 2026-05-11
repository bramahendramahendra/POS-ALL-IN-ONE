package segment

import (
	expense_repo "pos_api/domain/expense/repo"
	sync_handler "pos_api/domain/sync/handler"
	sync_repo "pos_api/domain/sync/repo"
	sync_service "pos_api/domain/sync/service"
	transaction_repo "pos_api/domain/transaction/repo"
	middleware "pos_api/middleware"
	pkgdatabase "pos_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func SyncRoutes(r *gin.RouterGroup) {
	syncRepo := sync_repo.NewSyncRepo(pkgdatabase.DB)
	txRepo := transaction_repo.NewTransactionRepo(pkgdatabase.DB)
	expRepo := expense_repo.NewExpenseRepo(pkgdatabase.DB)
	syncSvc := sync_service.NewSyncService(syncRepo, txRepo, expRepo)
	syncHand := sync_handler.NewSyncHandler(syncSvc)

	g := r.Group("/sync")
	{
		g.GET("/conflicts", middleware.RoleMiddleware("owner", "admin"), syncHand.GetConflicts)
		g.GET("/conflicts/count", middleware.RoleMiddleware("owner", "admin"), syncHand.GetConflictCount)
		g.POST("/conflicts/:id/resolve", middleware.RoleMiddleware("owner", "admin"), syncHand.ResolveConflict)
		g.GET("/queue", middleware.RoleMiddleware("owner", "admin"), syncHand.GetQueue)
		g.GET("/history", middleware.RoleMiddleware("owner", "admin"), syncHand.GetHistory)
		g.POST("/push", syncHand.PushSync)
	}
}
