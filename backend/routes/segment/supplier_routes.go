package segment

import (
	supplier_handler "permen_api/domain/supplier/handler"
	supplier_repo "permen_api/domain/supplier/repo"
	supplier_service "permen_api/domain/supplier/service"
	middleware "permen_api/middleware"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func SupplierRoutes(r *gin.RouterGroup) {
	supplierRepo := supplier_repo.NewSupplierRepo(pkgdatabase.DB)
	supplierSvc := supplier_service.NewSupplierService(supplierRepo)
	supplierHand := supplier_handler.NewSupplierHandler(supplierSvc)

	g := r.Group("/suppliers")
	{
		g.GET("", supplierHand.GetAll)
		g.GET("/active", supplierHand.GetActiveList)
		g.GET("/:id", supplierHand.GetDetail)
		g.POST("", middleware.RoleMiddleware("owner", "admin"), supplierHand.Create)
		g.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), supplierHand.Update)
		g.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), supplierHand.Delete)
		g.PATCH("/:id/toggle-status", middleware.RoleMiddleware("owner", "admin"), supplierHand.ToggleStatus)
	}
}
