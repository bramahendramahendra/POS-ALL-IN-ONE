package service_dashboard

import dto_dashboard "permen_api/domain/dashboard/dto"

type DashboardService interface {
	GetStats(date string) (*dto_dashboard.StatsResponse, error)
	GetSalesTrend(period string) ([]dto_dashboard.SalesTrendItem, error)
	GetTopProducts(filter dto_dashboard.DateRangeFilter) ([]dto_dashboard.TopProductItem, error)
	GetTopCategories(filter dto_dashboard.DateRangeFilter) ([]dto_dashboard.TopCategoryItem, error)
	GetPaymentMethods(filter dto_dashboard.DateRangeFilter) ([]dto_dashboard.PaymentMethodItem, error)
}
