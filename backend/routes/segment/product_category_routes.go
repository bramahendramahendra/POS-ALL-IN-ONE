package segment

import (
	product_category_handler "pos_api/domain/product_category/handler"
	product_category_repo "pos_api/domain/product_category/repo"
	product_category_service "pos_api/domain/product_category/service"
	middleware "pos_api/middleware"
	pkgdatabase "pos_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func ProductCategoryRoutes(r *gin.RouterGroup) {
	categoryRepo := product_category_repo.NewCategoryRepo(pkgdatabase.DB)
	categorySvc := product_category_service.NewCategoryService(categoryRepo)
	categoryHand := product_category_handler.NewCategoryHandler(categorySvc)

	g := r.Group("/categories")
	{
		g.GET("", categoryHand.GetAll)
		g.GET("/:id", categoryHand.GetByID)
		g.POST("", middleware.RoleMiddleware("owner", "admin"), categoryHand.Create)
		g.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), categoryHand.Update)
		g.DELETE("/:id", middleware.RoleMiddleware("owner"), categoryHand.Delete)
		g.PATCH("/:id/toggle-status", middleware.RoleMiddleware("owner", "admin"), categoryHand.ToggleStatus)
	}
}
