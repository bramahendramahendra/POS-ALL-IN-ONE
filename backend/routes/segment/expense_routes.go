package segment

import (
	cash_drawer_repo "permen_api/domain/cash_drawer/repo"
	expense_handler "permen_api/domain/expense/handler"
	expense_repo "permen_api/domain/expense/repo"
	expense_service "permen_api/domain/expense/service"
	middleware "permen_api/middleware"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func ExpenseRoutes(r *gin.RouterGroup) {
	cashDrawerRepo := cash_drawer_repo.NewCashDrawerRepo(pkgdatabase.DB)
	expenseRepo := expense_repo.NewExpenseRepo(pkgdatabase.DB)
	expenseSvc := expense_service.NewExpenseService(expenseRepo, cashDrawerRepo)
	expenseHand := expense_handler.NewExpenseHandler(expenseSvc)

	g := r.Group("/expenses")
	{
		g.GET("", expenseHand.GetAll)
		g.GET("/:id", expenseHand.GetByID)
		g.POST("", expenseHand.Create)
		g.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), expenseHand.Update)
		g.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), expenseHand.Delete)
	}
}
