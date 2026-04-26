package repo_dashboard

import dto_dashboard "permen_api/domain/dashboard/dto"

type DashboardRepo interface {
	GetTodayStats(date string) (*dto_dashboard.TodayStats, error)
	GetTodayExpenses(date string) (float64, error)
	GetMonthStats() (*dto_dashboard.MonthStats, error)
	GetMonthExpenses() (float64, error)
	GetLowStockCount() (int64, error)
	GetOpenReceivablesCount() (int64, error)
	GetSalesTrend(days int) ([]dto_dashboard.SalesTrendItem, error)
	GetTopProducts(filter dto_dashboard.DateRangeFilter) ([]dto_dashboard.TopProductItem, error)
	GetTopCategories(filter dto_dashboard.DateRangeFilter) ([]dto_dashboard.TopCategoryItem, error)
	GetPaymentMethods(filter dto_dashboard.DateRangeFilter) ([]dto_dashboard.PaymentMethodItem, error)
}
