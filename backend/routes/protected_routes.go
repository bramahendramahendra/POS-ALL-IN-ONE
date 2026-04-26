package routes

import (
	auth_handler "permen_api/domain/auth/handler"
	auth_repo "permen_api/domain/auth/repo"
	auth_service "permen_api/domain/auth/service"
	master_handler "permen_api/domain/master/handler"
	master_repo "permen_api/domain/master/repo"
	master_service "permen_api/domain/master/service"
	pin_handler "permen_api/domain/pin/handler"
	pin_repo "permen_api/domain/pin/repo"
	pin_service "permen_api/domain/pin/service"
	product_handler "permen_api/domain/product/handler"
	product_repo "permen_api/domain/product/repo"
	product_service "permen_api/domain/product/service"
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

	// Categories
	categoryRepo := master_repo.NewCategoryRepo(pkgdatabase.DB)
	categorySvc := master_service.NewCategoryService(categoryRepo)
	categoryHand := master_handler.NewCategoryHandler(categorySvc)

	categoryRoutes := r.Group("/categories")
	{
		categoryRoutes.GET("", categoryHand.GetAll)
		categoryRoutes.GET("/:id", categoryHand.GetByID)
		categoryRoutes.POST("", middleware.RoleMiddleware("owner", "admin"), categoryHand.Create)
		categoryRoutes.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), categoryHand.Update)
		categoryRoutes.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), categoryHand.Delete)
	}

	// Units
	unitRepo := master_repo.NewUnitRepo(pkgdatabase.DB)
	unitSvc := master_service.NewUnitService(unitRepo)
	unitHand := master_handler.NewUnitHandler(unitSvc)

	unitRoutes := r.Group("/units")
	{
		unitRoutes.GET("", unitHand.GetAll)
		unitRoutes.GET("/active", unitHand.GetActive)
		unitRoutes.GET("/:id", unitHand.GetByID)
		unitRoutes.POST("", middleware.RoleMiddleware("owner", "admin"), unitHand.Create)
		unitRoutes.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), unitHand.Update)
		unitRoutes.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), unitHand.Delete)
		unitRoutes.PATCH("/:id/toggle-status", middleware.RoleMiddleware("owner", "admin"), unitHand.ToggleStatus)
	}

	// Products
	productRepo := product_repo.NewProductRepo(pkgdatabase.DB)
	productSvc := product_service.NewProductService(productRepo, categoryRepo)
	productHand := product_handler.NewProductHandler(productSvc)

	productRoutes := r.Group("/products")
	{
		productRoutes.GET("", productHand.GetAll)
		productRoutes.GET("/search", productHand.Search)
		productRoutes.GET("/barcode/:barcode", productHand.GetByBarcode)
		productRoutes.GET("/:id", productHand.GetByID)
		productRoutes.POST("", middleware.RoleMiddleware("owner", "admin"), productHand.Create)
		productRoutes.POST("/import", middleware.RoleMiddleware("owner", "admin"), productHand.Import)
		productRoutes.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), productHand.Update)
		productRoutes.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), productHand.Delete)
		productRoutes.PATCH("/:id/toggle-status", middleware.RoleMiddleware("owner", "admin"), productHand.ToggleStatus)
	}
}
