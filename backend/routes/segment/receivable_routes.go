package segment

import (
	receivable_handler "permen_api/domain/receivable/handler"
	receivable_repo "permen_api/domain/receivable/repo"
	receivable_service "permen_api/domain/receivable/service"
	middleware "permen_api/middleware"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func ReceivableRoutes(r *gin.RouterGroup) {
	receivableRepo := receivable_repo.NewReceivableRepo(pkgdatabase.DB)
	receivableSvc := receivable_service.NewReceivableService(receivableRepo)
	receivableHand := receivable_handler.NewReceivableHandler(receivableSvc)

	g := r.Group("/receivables")
	{
		g.GET("", receivableHand.GetAll)
		g.GET("/summary", middleware.RoleMiddleware("owner", "admin"), receivableHand.GetSummary)
		g.GET("/:id", receivableHand.GetByID)
		g.GET("/:id/payments", receivableHand.GetPayments)
		g.POST("/:id/pay", receivableHand.Pay)
	}
}
