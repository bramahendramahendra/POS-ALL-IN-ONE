package segment

import (
	supplier_return_handler "permen_api/domain/supplier_return/handler"
	supplier_return_repo "permen_api/domain/supplier_return/repo"
	supplier_return_service "permen_api/domain/supplier_return/service"
	middleware "permen_api/middleware"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func SupplierReturnRoutes(r *gin.RouterGroup) {
	supplierReturnRepo := supplier_return_repo.NewSupplierReturnRepo(pkgdatabase.DB)
	supplierReturnSvc := supplier_return_service.NewSupplierReturnService(supplierReturnRepo)
	supplierReturnHand := supplier_return_handler.NewSupplierReturnHandler(supplierReturnSvc)

	g := r.Group("/supplier-returns")
	{
		g.GET("", supplierReturnHand.GetAll)
		g.GET("/:id", supplierReturnHand.GetByID)
		g.POST("", middleware.RoleMiddleware("owner", "admin"), supplierReturnHand.Create)
		g.PATCH("/:id/status", middleware.RoleMiddleware("owner", "admin"), supplierReturnHand.UpdateStatus)
		g.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), supplierReturnHand.Delete)
	}
}
