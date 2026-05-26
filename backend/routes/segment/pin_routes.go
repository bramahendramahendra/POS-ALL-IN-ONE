package segment

import (
	pin_handler "pos_api/domain/pin/handler"
	pin_repo "pos_api/domain/pin/repo"
	pin_service "pos_api/domain/pin/service"
	pkgdatabase "pos_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func PinRoutes(r *gin.RouterGroup) {
	pinRepo := pin_repo.NewPinRepo(pkgdatabase.DB)
	pinSvc := pin_service.NewPinService(pinRepo)
	pinHand := pin_handler.NewPinHandler(pinSvc)

	g := r.Group("/pin")
	{
		g.GET("/check", pinHand.CheckPin)
		g.POST("/set", pinHand.SetPin)
		g.POST("/verify", pinHand.VerifyPin)
		g.POST("/change", pinHand.ChangePin)
	}
}
