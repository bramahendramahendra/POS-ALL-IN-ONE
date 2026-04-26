package segment

import (
	report_handler "permen_api/domain/report/handler"
	report_repo "permen_api/domain/report/repo"
	report_service "permen_api/domain/report/service"
	middleware "permen_api/middleware"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func ReportRoutes(r *gin.RouterGroup) {
	reportRepo := report_repo.NewReportRepo(pkgdatabase.DB)
	reportSvc := report_service.NewReportService(reportRepo)
	reportHand := report_handler.NewReportHandler(reportSvc)

	g := r.Group("/reports")
	{
		g.GET("/sales", reportHand.GetSalesReport)
		g.GET("/sales/chart", reportHand.GetSalesChart)
		g.GET("/sales/export", middleware.RoleMiddleware("owner", "admin"), reportHand.ExportSalesReport)
		g.GET("/profit-loss", middleware.RoleMiddleware("owner", "admin"), reportHand.GetProfitLoss)
		g.GET("/profit-loss/export", middleware.RoleMiddleware("owner", "admin"), reportHand.ExportProfitLoss)
		g.GET("/stock", reportHand.GetStockReport)
		g.GET("/stock/export", middleware.RoleMiddleware("owner", "admin"), reportHand.ExportStockReport)
		g.GET("/cashier", middleware.RoleMiddleware("owner", "admin"), reportHand.GetCashierReport)
		g.GET("/cashier/export", middleware.RoleMiddleware("owner", "admin"), reportHand.ExportCashierReport)
	}
}
