package segment

import (
	purchase_handler "permen_api/domain/purchase/handler"
	purchase_repo "permen_api/domain/purchase/repo"
	purchase_service "permen_api/domain/purchase/service"
	middleware "permen_api/middleware"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func PurchaseRoutes(r *gin.RouterGroup) {
	purchaseRepo := purchase_repo.NewPurchaseRepo(pkgdatabase.DB)
	purchaseSvc := purchase_service.NewPurchaseService(purchaseRepo)
	purchaseHand := purchase_handler.NewPurchaseHandler(purchaseSvc)

	g := r.Group("/purchases")
	{
		g.GET("", purchaseHand.GetAll)
		g.GET("/:id", purchaseHand.GetByID)
		g.GET("/:id/items", purchaseHand.GetItems)
		g.POST("", middleware.RoleMiddleware("owner", "admin"), purchaseHand.Create)
		g.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), purchaseHand.Update)
		g.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), purchaseHand.Delete)
		g.POST("/:id/pay", middleware.RoleMiddleware("owner", "admin"), purchaseHand.Pay)
	}
}
