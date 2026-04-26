package segment

import (
	customer_handler "permen_api/domain/customer/handler"
	customer_repo "permen_api/domain/customer/repo"
	customer_service "permen_api/domain/customer/service"
	middleware "permen_api/middleware"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func CustomerRoutes(r *gin.RouterGroup) {
	customerRepo := customer_repo.NewCustomerRepo(pkgdatabase.DB)
	customerSvc := customer_service.NewCustomerService(customerRepo)
	customerHand := customer_handler.NewCustomerHandler(customerSvc)

	g := r.Group("/customers")
	{
		g.GET("", customerHand.GetAll)
		g.GET("/active", customerHand.GetActiveList)
		g.GET("/:id", customerHand.GetByID)
		g.POST("", middleware.RoleMiddleware("owner", "admin"), customerHand.Create)
		g.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), customerHand.Update)
		g.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), customerHand.Delete)
		g.PATCH("/:id/toggle-status", middleware.RoleMiddleware("owner", "admin"), customerHand.ToggleStatus)
	}
}
