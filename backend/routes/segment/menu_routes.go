package segment

import (
	menu_handler "pos_api/domain/menu/handler"
	menu_repo "pos_api/domain/menu/repo"
	menu_service "pos_api/domain/menu/service"
	middleware "pos_api/middleware"
	pkgdatabase "pos_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func MenuRoutes(r *gin.RouterGroup) {
	menuRepo := menu_repo.NewMenuRepo(pkgdatabase.DB)
	menuSvc := menu_service.NewMenuService(menuRepo)
	menuHand := menu_handler.NewMenuHandler(menuSvc)

	g := r.Group("/menus")
	{
		// Endpoint untuk user yang sedang login — semua role boleh akses
		g.GET("/my", menuHand.GetMyMenus)

		// Endpoint manajemen menu — owner & admin bisa lihat, owner bisa ubah
		g.GET("",              middleware.RoleMiddleware("owner", "admin"), menuHand.GetAll)
		g.GET("/:id",         middleware.RoleMiddleware("owner", "admin"), menuHand.GetByID)
		g.POST("",            middleware.RoleMiddleware("owner"),          menuHand.Create)
		g.PUT("/:id",         middleware.RoleMiddleware("owner"),          menuHand.Update)
		g.DELETE("/:id",      middleware.RoleMiddleware("owner"),          menuHand.Delete)
		g.PATCH("/reorder",   middleware.RoleMiddleware("owner"),          menuHand.Reorder)
	}
}
