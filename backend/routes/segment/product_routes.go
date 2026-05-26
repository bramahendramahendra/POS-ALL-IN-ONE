package segment

import (
	product_category_repo "pos_api/domain/product_category/repo"
	product_handler "pos_api/domain/product/handler"
	product_repo "pos_api/domain/product/repo"
	product_service "pos_api/domain/product/service"
	middleware "pos_api/middleware"
	pkgdatabase "pos_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func ProductRoutes(r *gin.RouterGroup) {
	categoryRepo := product_category_repo.NewCategoryRepo(pkgdatabase.DB)

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
		g.GET("/generate-barcode", middleware.RoleMiddleware("owner", "admin"), productHand.GenerateBarcode)
		g.GET("/generate-sku", middleware.RoleMiddleware("owner", "admin"), productHand.GenerateSku)
		g.GET("/barcode/:barcode", productHand.GetByBarcode)
		g.GET("/:id", productHand.GetByID)
		g.POST("", middleware.RoleMiddleware("owner", "admin"), productHand.Create)
		g.POST("/import", middleware.RoleMiddleware("owner", "admin"), productHand.Import)
		g.POST("/import-bulk", middleware.RoleMiddleware("owner", "admin"), productHand.ImportBulk)
		g.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), productHand.Update)
		g.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), productHand.Delete)
		g.PATCH("/:id/toggle-status", middleware.RoleMiddleware("owner", "admin"), productHand.ToggleStatus)

		g.GET("/:id/units", productUnitHand.GetByProduct)
		g.POST("/:id/units", middleware.RoleMiddleware("owner", "admin"), productUnitHand.Save)
		g.DELETE("/:id/units/:unit_id", middleware.RoleMiddleware("owner", "admin"), productUnitHand.Delete)

		g.GET("/:id/prices", productPriceHand.GetByProduct)
		g.POST("/:id/prices", middleware.RoleMiddleware("owner", "admin"), productPriceHand.Save)
	}
}
