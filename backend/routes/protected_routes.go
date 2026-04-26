package routes

import (
	auth_handler "permen_api/domain/auth/handler"
	auth_repo "permen_api/domain/auth/repo"
	auth_service "permen_api/domain/auth/service"
	pin_handler "permen_api/domain/pin/handler"
	pin_repo "permen_api/domain/pin/repo"
	pin_service "permen_api/domain/pin/service"
	user_handler "permen_api/domain/user/handler"
	user_repo "permen_api/domain/user/repo"
	user_service "permen_api/domain/user/service"
	middleware "permen_api/middleware"
	pos_middleware "permen_api/middleware/auth"
	pkgdatabase "permen_api/pkg/database"

	"github.com/gin-gonic/gin"
)

func protectedRoutes(r *gin.RouterGroup) {
	authRepo := auth_repo.NewAuthRepo(pkgdatabase.DB)
	authSvc := auth_service.NewAuthService(authRepo)
	authHand := auth_handler.NewAuthHandler(authSvc)

	r.Use(pos_middleware.POSBearerAuthMiddleware(authSvc))

	r.GET("/auth/me", authHand.GetMe)
	r.POST("/auth/logout", authHand.Logout)

	// PIN
	pinRepo := pin_repo.NewPinRepo(pkgdatabase.DB)
	pinSvc := pin_service.NewPinService(pinRepo)
	pinHand := pin_handler.NewPinHandler(pinSvc)

	r.GET("/pin/check", pinHand.CheckPin)
	r.POST("/pin/set", pinHand.SetPin)
	r.POST("/pin/verify", pinHand.VerifyPin)
	r.POST("/pin/change", pinHand.ChangePin)

	// User Management
	userRepo := user_repo.NewUserRepo(pkgdatabase.DB)
	userSvc := user_service.NewUserService(userRepo)
	userHand := user_handler.NewUserHandler(userSvc)

	userRoutes := r.Group("/users", middleware.RoleMiddleware("owner", "admin"))
	{
		userRoutes.GET("", userHand.GetAll)
		userRoutes.GET("/:id", userHand.GetByID)
		userRoutes.POST("", userHand.Create)
		userRoutes.PUT("/:id", userHand.Update)
		userRoutes.DELETE("/:id", userHand.Delete)
		userRoutes.PATCH("/:id/toggle-status", userHand.ToggleStatus)
	}
}
