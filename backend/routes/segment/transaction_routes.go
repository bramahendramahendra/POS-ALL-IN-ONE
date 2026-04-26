package segment

import (
	transaction_handler "permen_api/domain/transaction/handler"
	transaction_repo "permen_api/domain/transaction/repo"
	transaction_service "permen_api/domain/transaction/service"
	middleware "permen_api/middleware"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func TransactionRoutes(r *gin.RouterGroup) {
	transactionRepo := transaction_repo.NewTransactionRepo(pkgdatabase.DB)
	transactionSvc := transaction_service.NewTransactionService(transactionRepo)
	transactionHand := transaction_handler.NewTransactionHandler(transactionSvc)

	g := r.Group("/transactions")
	{
		g.GET("", transactionHand.GetAll)
		g.GET("/:id", transactionHand.GetByID)
		g.POST("", transactionHand.Create)
		g.PATCH("/:id/void", middleware.RoleMiddleware("owner", "admin"), transactionHand.Void)
	}
}
