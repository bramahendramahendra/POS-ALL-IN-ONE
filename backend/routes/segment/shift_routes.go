package segment

import (
	shift_handler "permen_api/domain/shift/handler"
	shift_repo "permen_api/domain/shift/repo"
	shift_service "permen_api/domain/shift/service"
	middleware "permen_api/middleware"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func ShiftRoutes(r *gin.RouterGroup) {
	shiftRepo := shift_repo.NewShiftRepo(pkgdatabase.DB)
	shiftSvc := shift_service.NewShiftService(shiftRepo)
	shiftHand := shift_handler.NewShiftHandler(shiftSvc)

	g := r.Group("/shifts")
	{
		g.GET("", shiftHand.GetAll)
		g.GET("/active", shiftHand.GetActive)
		g.GET("/summary", middleware.RoleMiddleware("owner", "admin"), shiftHand.GetSummary)
		g.GET("/:id", shiftHand.GetByID)
		g.POST("", middleware.RoleMiddleware("owner", "admin"), shiftHand.Create)
		g.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), shiftHand.Update)
		g.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), shiftHand.Delete)
		g.PATCH("/:id/toggle-status", middleware.RoleMiddleware("owner", "admin"), shiftHand.ToggleStatus)
	}
}
