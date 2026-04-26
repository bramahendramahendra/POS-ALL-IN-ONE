package segment

import (
	cash_drawer_handler "permen_api/domain/cash_drawer/handler"
	cash_drawer_repo "permen_api/domain/cash_drawer/repo"
	cash_drawer_service "permen_api/domain/cash_drawer/service"
	middleware "permen_api/middleware"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func CashDrawerRoutes(r *gin.RouterGroup) {
	cashDrawerRepo := cash_drawer_repo.NewCashDrawerRepo(pkgdatabase.DB)
	cashDrawerSvc := cash_drawer_service.NewCashDrawerService(cashDrawerRepo)
	cashDrawerHand := cash_drawer_handler.NewCashDrawerHandler(cashDrawerSvc)

	g := r.Group("/cash-drawer")
	{
		g.GET("/current", cashDrawerHand.GetCurrent)
		g.GET("", middleware.RoleMiddleware("owner", "admin"), cashDrawerHand.GetHistory)
		g.GET("/:id", cashDrawerHand.GetByID)
		g.POST("/open", cashDrawerHand.Open)
		g.POST("/:id/close", cashDrawerHand.Close)
		g.PATCH("/:id/update-sales", cashDrawerHand.UpdateSales)
		g.PATCH("/:id/update-expenses", cashDrawerHand.UpdateExpenses)
	}
}
