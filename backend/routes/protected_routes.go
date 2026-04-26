package routes

import (
	report_handler "permen_api/domain/report/handler"
	report_repo "permen_api/domain/report/repo"
	report_service "permen_api/domain/report/service"
	stock_mutation_handler "permen_api/domain/stock_mutation/handler"
	stock_mutation_repo "permen_api/domain/stock_mutation/repo"
	stock_mutation_service "permen_api/domain/stock_mutation/service"
	receivable_handler "permen_api/domain/receivable/handler"
	receivable_repo "permen_api/domain/receivable/repo"
	receivable_service "permen_api/domain/receivable/service"
	shift_handler "permen_api/domain/shift/handler"
	shift_repo "permen_api/domain/shift/repo"
	shift_service "permen_api/domain/shift/service"
	auth_handler "permen_api/domain/auth/handler"
	auth_repo "permen_api/domain/auth/repo"
	auth_service "permen_api/domain/auth/service"
	cash_drawer_handler "permen_api/domain/cash_drawer/handler"
	customer_handler "permen_api/domain/customer/handler"
	customer_repo "permen_api/domain/customer/repo"
	customer_service "permen_api/domain/customer/service"
	cash_drawer_repo "permen_api/domain/cash_drawer/repo"
	cash_drawer_service "permen_api/domain/cash_drawer/service"
	expense_handler "permen_api/domain/expense/handler"
	expense_repo "permen_api/domain/expense/repo"
	expense_service "permen_api/domain/expense/service"
	purchase_handler "permen_api/domain/purchase/handler"
	purchase_repo "permen_api/domain/purchase/repo"
	purchase_service "permen_api/domain/purchase/service"
	supplier_handler "permen_api/domain/supplier/handler"
	supplier_repo "permen_api/domain/supplier/repo"
	supplier_service "permen_api/domain/supplier/service"
	supplier_return_handler "permen_api/domain/supplier_return/handler"
	supplier_return_repo "permen_api/domain/supplier_return/repo"
	supplier_return_service "permen_api/domain/supplier_return/service"
	master_handler "permen_api/domain/master/handler"
	master_repo "permen_api/domain/master/repo"
	master_service "permen_api/domain/master/service"
	pin_handler "permen_api/domain/pin/handler"
	pin_repo "permen_api/domain/pin/repo"
	pin_service "permen_api/domain/pin/service"
	product_handler "permen_api/domain/product/handler"
	product_repo "permen_api/domain/product/repo"
	product_service "permen_api/domain/product/service"
	transaction_handler "permen_api/domain/transaction/handler"
	transaction_repo "permen_api/domain/transaction/repo"
	transaction_service "permen_api/domain/transaction/service"
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

	productUnitRepo := product_repo.NewProductUnitRepo(pkgdatabase.DB)
	productUnitSvc := product_service.NewProductUnitService(productUnitRepo, productRepo)
	productUnitHand := product_handler.NewProductUnitHandler(productUnitSvc)

	productPriceRepo := product_repo.NewProductPriceRepo(pkgdatabase.DB)
	productPriceSvc := product_service.NewProductPriceService(productPriceRepo, productRepo)
	productPriceHand := product_handler.NewProductPriceHandler(productPriceSvc)

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

		// Product Units
		productRoutes.GET("/:product_id/units", productUnitHand.GetByProduct)
		productRoutes.POST("/:product_id/units", middleware.RoleMiddleware("owner", "admin"), productUnitHand.Save)
		productRoutes.DELETE("/:product_id/units/:unit_id", middleware.RoleMiddleware("owner", "admin"), productUnitHand.Delete)

		// Product Prices
		productRoutes.GET("/:product_id/prices", productPriceHand.GetByProduct)
		productRoutes.POST("/:product_id/prices", middleware.RoleMiddleware("owner", "admin"), productPriceHand.Save)
	}

	// Transactions
	transactionRepo := transaction_repo.NewTransactionRepo(pkgdatabase.DB)
	transactionSvc := transaction_service.NewTransactionService(transactionRepo)
	transactionHand := transaction_handler.NewTransactionHandler(transactionSvc)

	transGroup := r.Group("/transactions")
	{
		transGroup.GET("", transactionHand.GetAll)
		transGroup.GET("/:id", transactionHand.GetByID)
		transGroup.POST("", transactionHand.Create)
		transGroup.PATCH("/:id/void", middleware.RoleMiddleware("owner", "admin"), transactionHand.Void)
	}

	// Cash Drawer
	cashDrawerRepo := cash_drawer_repo.NewCashDrawerRepo(pkgdatabase.DB)
	cashDrawerSvc := cash_drawer_service.NewCashDrawerService(cashDrawerRepo)
	cashDrawerHand := cash_drawer_handler.NewCashDrawerHandler(cashDrawerSvc)

	// Expenses
	expenseRepo := expense_repo.NewExpenseRepo(pkgdatabase.DB)
	expenseSvc := expense_service.NewExpenseService(expenseRepo, cashDrawerRepo)
	expenseHand := expense_handler.NewExpenseHandler(expenseSvc)

	expenseGroup := r.Group("/expenses")
	{
		expenseGroup.GET("", expenseHand.GetAll)
		expenseGroup.GET("/:id", expenseHand.GetByID)
		expenseGroup.POST("", expenseHand.Create)
		expenseGroup.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), expenseHand.Update)
		expenseGroup.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), expenseHand.Delete)
	}

	// Purchase Orders
	purchaseRepo := purchase_repo.NewPurchaseRepo(pkgdatabase.DB)
	purchaseSvc := purchase_service.NewPurchaseService(purchaseRepo)
	purchaseHand := purchase_handler.NewPurchaseHandler(purchaseSvc)

	purchaseGroup := r.Group("/purchases")
	{
		purchaseGroup.GET("", purchaseHand.GetAll)
		purchaseGroup.GET("/:id", purchaseHand.GetByID)
		purchaseGroup.GET("/:id/items", purchaseHand.GetItems)
		purchaseGroup.POST("", middleware.RoleMiddleware("owner", "admin"), purchaseHand.Create)
		purchaseGroup.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), purchaseHand.Update)
		purchaseGroup.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), purchaseHand.Delete)
		purchaseGroup.POST("/:id/pay", middleware.RoleMiddleware("owner", "admin"), purchaseHand.Pay)
	}

	// Suppliers
	supplierRepo := supplier_repo.NewSupplierRepo(pkgdatabase.DB)
	supplierSvc := supplier_service.NewSupplierService(supplierRepo)
	supplierHand := supplier_handler.NewSupplierHandler(supplierSvc)

	supplierGroup := r.Group("/suppliers")
	{
		supplierGroup.GET("", supplierHand.GetAll)
		supplierGroup.GET("/active", supplierHand.GetActiveList)
		supplierGroup.GET("/:id", supplierHand.GetDetail)
		supplierGroup.POST("", middleware.RoleMiddleware("owner", "admin"), supplierHand.Create)
		supplierGroup.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), supplierHand.Update)
		supplierGroup.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), supplierHand.Delete)
		supplierGroup.PATCH("/:id/toggle-status", middleware.RoleMiddleware("owner", "admin"), supplierHand.ToggleStatus)
	}

	// Supplier Returns
	supplierReturnRepo := supplier_return_repo.NewSupplierReturnRepo(pkgdatabase.DB)
	supplierReturnSvc := supplier_return_service.NewSupplierReturnService(supplierReturnRepo)
	supplierReturnHand := supplier_return_handler.NewSupplierReturnHandler(supplierReturnSvc)

	returnGroup := r.Group("/supplier-returns")
	{
		returnGroup.GET("", supplierReturnHand.GetAll)
		returnGroup.GET("/:id", supplierReturnHand.GetByID)
		returnGroup.POST("", middleware.RoleMiddleware("owner", "admin"), supplierReturnHand.Create)
		returnGroup.PATCH("/:id/status", middleware.RoleMiddleware("owner", "admin"), supplierReturnHand.UpdateStatus)
		returnGroup.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), supplierReturnHand.Delete)
	}

	// Customers
	customerRepoInst := customer_repo.NewCustomerRepo(pkgdatabase.DB)
	customerSvc := customer_service.NewCustomerService(customerRepoInst)
	customerHand := customer_handler.NewCustomerHandler(customerSvc)

	customerGroup := r.Group("/customers")
	{
		customerGroup.GET("", customerHand.GetAll)
		customerGroup.GET("/active", customerHand.GetActiveList)
		customerGroup.GET("/:id", customerHand.GetByID)
		customerGroup.POST("", middleware.RoleMiddleware("owner", "admin"), customerHand.Create)
		customerGroup.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), customerHand.Update)
		customerGroup.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), customerHand.Delete)
		customerGroup.PATCH("/:id/toggle-status", middleware.RoleMiddleware("owner", "admin"), customerHand.ToggleStatus)
	}

	// Receivables
	receivableRepoInst := receivable_repo.NewReceivableRepo(pkgdatabase.DB)
	receivableSvc := receivable_service.NewReceivableService(receivableRepoInst)
	receivableHand := receivable_handler.NewReceivableHandler(receivableSvc)

	receivableGroup := r.Group("/receivables")
	{
		receivableGroup.GET("", receivableHand.GetAll)
		receivableGroup.GET("/summary", middleware.RoleMiddleware("owner", "admin"), receivableHand.GetSummary)
		receivableGroup.GET("/:id", receivableHand.GetByID)
		receivableGroup.GET("/:id/payments", receivableHand.GetPayments)
		receivableGroup.POST("/:id/pay", receivableHand.Pay)
	}

	// Shifts
	shiftRepoInst := shift_repo.NewShiftRepo(pkgdatabase.DB)
	shiftSvc := shift_service.NewShiftService(shiftRepoInst)
	shiftHand := shift_handler.NewShiftHandler(shiftSvc)

	shiftGroup := r.Group("/shifts")
	{
		shiftGroup.GET("", shiftHand.GetAll)
		shiftGroup.GET("/active", shiftHand.GetActive)
		shiftGroup.GET("/summary", middleware.RoleMiddleware("owner", "admin"), shiftHand.GetSummary)
		shiftGroup.GET("/:id", shiftHand.GetByID)
		shiftGroup.POST("", middleware.RoleMiddleware("owner", "admin"), shiftHand.Create)
		shiftGroup.PUT("/:id", middleware.RoleMiddleware("owner", "admin"), shiftHand.Update)
		shiftGroup.DELETE("/:id", middleware.RoleMiddleware("owner", "admin"), shiftHand.Delete)
		shiftGroup.PATCH("/:id/toggle-status", middleware.RoleMiddleware("owner", "admin"), shiftHand.ToggleStatus)
	}

	// Stock Mutations
	stockMutationRepoInst := stock_mutation_repo.NewStockMutationRepo(pkgdatabase.DB)
	stockMutationSvc := stock_mutation_service.NewStockMutationService(stockMutationRepoInst)
	stockMutationHand := stock_mutation_handler.NewStockMutationHandler(stockMutationSvc)

	mutationGroup := r.Group("/stock-mutations", middleware.RoleMiddleware("owner", "admin"))
	{
		mutationGroup.GET("", stockMutationHand.GetAll)
		mutationGroup.GET("/product/:product_id", stockMutationHand.GetByProduct)
	}

	cashGroup := r.Group("/cash-drawer")
	{
		cashGroup.GET("/current", cashDrawerHand.GetCurrent)
		cashGroup.GET("", middleware.RoleMiddleware("owner", "admin"), cashDrawerHand.GetHistory)
		cashGroup.GET("/:id", cashDrawerHand.GetByID)
		cashGroup.POST("/open", cashDrawerHand.Open)
		cashGroup.POST("/:id/close", cashDrawerHand.Close)
		cashGroup.PATCH("/:id/update-sales", cashDrawerHand.UpdateSales)
		cashGroup.PATCH("/:id/update-expenses", cashDrawerHand.UpdateExpenses)
	}

	// Reports
	reportRepoInst := report_repo.NewReportRepo(pkgdatabase.DB)
	reportSvc := report_service.NewReportService(reportRepoInst)
	reportHand := report_handler.NewReportHandler(reportSvc)

	reportGroup := r.Group("/reports")
	{
		reportGroup.GET("/sales", reportHand.GetSalesReport)
		reportGroup.GET("/sales/chart", reportHand.GetSalesChart)
		reportGroup.GET("/sales/export", middleware.RoleMiddleware("owner", "admin"), reportHand.ExportSalesReport)
		reportGroup.GET("/profit-loss", middleware.RoleMiddleware("owner", "admin"), reportHand.GetProfitLoss)
		reportGroup.GET("/profit-loss/export", middleware.RoleMiddleware("owner", "admin"), reportHand.ExportProfitLoss)
		reportGroup.GET("/stock", reportHand.GetStockReport)
		reportGroup.GET("/stock/export", middleware.RoleMiddleware("owner", "admin"), reportHand.ExportStockReport)
		reportGroup.GET("/cashier", middleware.RoleMiddleware("owner", "admin"), reportHand.GetCashierReport)
		reportGroup.GET("/cashier/export", middleware.RoleMiddleware("owner", "admin"), reportHand.ExportCashierReport)
	}
}
