package routes

import (
	auth_repo "pos_api/domain/auth/repo"
	auth_service "pos_api/domain/auth/service"
	pos_middleware "pos_api/middleware/auth"
	pkgdatabase "pos_api/pkg/database"
	segment "pos_api/routes/segment"

	"github.com/gin-gonic/gin"
)

func protectedRoutes(r *gin.RouterGroup) {
	authRepo := auth_repo.NewAuthRepo(pkgdatabase.DB)
	authSvc := auth_service.NewAuthService(authRepo)

	r.Use(pos_middleware.POSBearerAuthMiddleware(authSvc))

	segment.AuthRoutes(r)
	segment.PinRoutes(r)
	segment.UserRoutes(r)
	segment.ProductCategoryRoutes(r)
	segment.ProductUnitRoutes(r)
	segment.ProductRoutes(r)
	segment.TransactionRoutes(r)
	segment.CashDrawerRoutes(r)
	segment.ExpenseRoutes(r)
	segment.PaymentStatusRoutes(r)
	segment.PaymentMethodRoutes(r)
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
	segment.RoleRoutes(r)
	segment.MenuRoutes(r)
	segment.AccessRoutes(r)
}
