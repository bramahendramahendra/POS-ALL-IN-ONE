package segment

import (
	role_handler "pos_api/domain/role/handler"
	role_repo "pos_api/domain/role/repo"
	role_service "pos_api/domain/role/service"
	middleware "pos_api/middleware"
	pkgdatabase "pos_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func RoleRoutes(r *gin.RouterGroup) {
	roleRepo := role_repo.NewRoleRepo(pkgdatabase.DB)
	roleSvc := role_service.NewRoleService(roleRepo)
	roleHand := role_handler.NewRoleHandler(roleSvc)

	g := r.Group("/roles")
	{
		g.GET("",                 middleware.RoleMiddleware("owner", "admin"), roleHand.GetAll)
		g.GET("/:id",             middleware.RoleMiddleware("owner", "admin"), roleHand.GetByID)
		g.POST("",                middleware.RoleMiddleware("owner"),          roleHand.Create)
		g.PUT("/:id",             middleware.RoleMiddleware("owner"),          roleHand.Update)
		g.DELETE("/:id",          middleware.RoleMiddleware("owner"),          roleHand.Delete)
		g.PATCH("/:id/toggle-status", middleware.RoleMiddleware("owner"),     roleHand.ToggleStatus)
	}
}
