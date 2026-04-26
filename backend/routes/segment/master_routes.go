package segment

import (
	master_handler "permen_api/domain/master/handler"
	master_repo "permen_api/domain/master/repo"
	master_service "permen_api/domain/master/service"
	middleware "permen_api/middleware"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func CategoryRoutes(r *gin.RouterGroup) {
	categoryRepo := master_repo.NewCategoryRepo(pkgdatabase.DB)
	categorySvc := master_service.NewCategoryService(categoryRepo)
	categoryHand := master_handler.NewCategoryHandler(categorySvc)

	g := r.Group("/categories")
	{
		g.GET("", categoryHand.GetAll)
		g.GET("/:id", categoryHand.GetByID)
		g.POST("", middleware.RoleMiddleware("owner", "admin"), categoryHand.Create)
		g.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), categoryHand.Update)
		g.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), categoryHand.Delete)
	}
}

func UnitRoutes(r *gin.RouterGroup) {
	unitRepo := master_repo.NewUnitRepo(pkgdatabase.DB)
	unitSvc := master_service.NewUnitService(unitRepo)
	unitHand := master_handler.NewUnitHandler(unitSvc)

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
