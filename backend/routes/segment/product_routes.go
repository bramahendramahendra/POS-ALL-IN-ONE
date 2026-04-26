package segment

import (
	master_repo "permen_api/domain/master/repo"
	product_handler "permen_api/domain/product/handler"
	product_repo "permen_api/domain/product/repo"
	product_service "permen_api/domain/product/service"
	middleware "permen_api/middleware"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func ProductRoutes(r *gin.RouterGroup) {
	categoryRepo := master_repo.NewCategoryRepo(pkgdatabase.DB)

	productRepo := product_repo.NewProductRepo(pkgdatabase.DB)
	productSvc := product_service.NewProductService(productRepo, categoryRepo)
	productHand := product_handler.NewProductHandler(productSvc)

	productUnitRepo := product_repo.NewProductUnitRepo(pkgdatabase.DB)
	productUnitSvc := product_service.NewProductUnitService(productUnitRepo, productRepo)
	productUnitHand := product_handler.NewProductUnitHandler(productUnitSvc)

	productPriceRepo := product_repo.NewProductPriceRepo(pkgdatabase.DB)
	productPriceSvc := product_service.NewProductPriceService(productPriceRepo, productRepo)
	productPriceHand := product_handler.NewProductPriceHandler(productPriceSvc)

	g := r.Group("/products")
	{
		g.GET("", productHand.GetAll)
		g.GET("/search", productHand.Search)
		g.GET("/barcode/:barcode", productHand.GetByBarcode)
		g.GET("/:id", productHand.GetByID)
		g.POST("", middleware.RoleMiddleware("owner", "admin"), productHand.Create)
		g.POST("/import", middleware.RoleMiddleware("owner", "admin"), productHand.Import)
		g.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), productHand.Update)
		g.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), productHand.Delete)
		g.PATCH("/:id/toggle-status", middleware.RoleMiddleware("owner", "admin"), productHand.ToggleStatus)

		g.GET("/:product_id/units", productUnitHand.GetByProduct)
		g.POST("/:product_id/units", middleware.RoleMiddleware("owner", "admin"), productUnitHand.Save)
		g.DELETE("/:product_id/units/:unit_id", middleware.RoleMiddleware("owner", "admin"), productUnitHand.Delete)

		g.GET("/:product_id/prices", productPriceHand.GetByProduct)
		g.POST("/:product_id/prices", middleware.RoleMiddleware("owner", "admin"), productPriceHand.Save)
	}
}
