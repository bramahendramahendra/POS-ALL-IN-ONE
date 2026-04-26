package segment

import (
	user_handler "permen_api/domain/user/handler"
	user_repo "permen_api/domain/user/repo"
	user_service "permen_api/domain/user/service"
	middleware "permen_api/middleware"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func UserRoutes(r *gin.RouterGroup) {
	userRepo := user_repo.NewUserRepo(pkgdatabase.DB)
	userSvc := user_service.NewUserService(userRepo)
	userHand := user_handler.NewUserHandler(userSvc)

	g := r.Group("/users", middleware.RoleMiddleware("owner", "admin"))
	{
		g.GET("", userHand.GetAll)
		g.GET("/:id", userHand.GetByID)
		g.POST("", userHand.Create)
		g.PUT("/:id", userHand.Update)
		g.DELETE("/:id", userHand.Delete)
		g.PATCH("/:id/toggle-status", userHand.ToggleStatus)
	}
}
