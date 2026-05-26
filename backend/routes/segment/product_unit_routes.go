package segment

import (
	product_unit_handler "pos_api/domain/product_unit/handler"
	product_unit_repo "pos_api/domain/product_unit/repo"
	product_unit_service "pos_api/domain/product_unit/service"
	middleware "pos_api/middleware"
	pkgdatabase "pos_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func ProductUnitRoutes(r *gin.RouterGroup) {
	unitRepo := product_unit_repo.NewUnitRepo(pkgdatabase.DB)
	unitSvc := product_unit_service.NewUnitService(unitRepo)
	unitHand := product_unit_handler.NewUnitHandler(unitSvc)

	g := r.Group("/units")
	{
		g.GET("", unitHand.GetAll)
		g.GET("/active", unitHand.GetActive)
		g.GET("/:id", unitHand.GetByID)
		g.POST("", middleware.RoleMiddleware("owner", "admin"), unitHand.Create)
		g.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), unitHand.Update)
		g.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), unitHand.Delete)
		g.PATCH("/:id/toggle-status", middleware.RoleMiddleware("owner", "admin"), unitHand.ToggleStatus)
	}
}
