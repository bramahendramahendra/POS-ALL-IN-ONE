package routes

import (
	auth_repo "permen_api/domain/auth/repo"
	auth_service "permen_api/domain/auth/service"
	segment "permen_api/routes/segment"
	pos_middleware "permen_api/middleware/auth"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func protectedRoutes(r *gin.RouterGroup) {
	authRepo := auth_repo.NewAuthRepo(pkgdatabase.DB)
	authSvc := auth_service.NewAuthService(authRepo)

	r.Use(pos_middleware.POSBearerAuthMiddleware(authSvc))

	segment.AuthRoutes(r)
	segment.UserRoutes(r)
	segment.CategoryRoutes(r)
	segment.UnitRoutes(r)
	segment.ProductRoutes(r)
	segment.TransactionRoutes(r)
	segment.CashDrawerRoutes(r)
	segment.ExpenseRoutes(r)
	segment.PurchaseRoutes(r)
	segment.SupplierRoutes(r)
	segment.SupplierReturnRoutes(r)
	segment.CustomerRoutes(r)
	segment.ReceivableRoutes(r)
	segment.ShiftRoutes(r)
	segment.StockMutationRoutes(r)
	segment.ReportRoutes(r)
	segment.DashboardRoutes(r)
	segment.SettingRoutes(r)
	segment.BackupRoutes(r)
	segment.SyncRoutes(r)
	segment.VersionAdminRoutes(r)
}
