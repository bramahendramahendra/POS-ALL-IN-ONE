package segment

import (
	dashboard_handler "permen_api/domain/dashboard/handler"
	dashboard_repo "permen_api/domain/dashboard/repo"
	dashboard_service "permen_api/domain/dashboard/service"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func DashboardRoutes(r *gin.RouterGroup) {
	dashboardRepo := dashboard_repo.NewDashboardRepo(pkgdatabase.DB)
	dashboardSvc := dashboard_service.NewDashboardService(dashboardRepo)
	dashboardHand := dashboard_handler.NewDashboardHandler(dashboardSvc)

	g := r.Group("/dashboard")
	{
		g.GET("/stats", dashboardHand.GetStats)
		g.GET("/sales-trend", dashboardHand.GetSalesTrend)
		g.GET("/top-products", dashboardHand.GetTopProducts)
		g.GET("/top-categories", dashboardHand.GetTopCategories)
		g.GET("/payment-methods", dashboardHand.GetPaymentMethods)
	}
}
