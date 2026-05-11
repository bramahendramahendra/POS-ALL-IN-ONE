package segment

import (
	stock_mutation_handler "pos_api/domain/stock_mutation/handler"
	stock_mutation_repo "pos_api/domain/stock_mutation/repo"
	stock_mutation_service "pos_api/domain/stock_mutation/service"
	middleware "pos_api/middleware"
	pkgdatabase "pos_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func StockMutationRoutes(r *gin.RouterGroup) {
	stockMutationRepo := stock_mutation_repo.NewStockMutationRepo(pkgdatabase.DB)
	stockMutationSvc := stock_mutation_service.NewStockMutationService(stockMutationRepo)
	stockMutationHand := stock_mutation_handler.NewStockMutationHandler(stockMutationSvc)

	g := r.Group("/stock-mutations", middleware.RoleMiddleware("owner", "admin"))
	{
		g.GET("", stockMutationHand.GetAll)
		g.GET("/product/:product_id", stockMutationHand.GetByProduct)
	}
}
