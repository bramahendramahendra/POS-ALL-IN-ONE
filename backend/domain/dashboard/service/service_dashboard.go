package service_dashboard

import (
	dto_dashboard "permen_api/domain/dashboard/dto"
	repo_dashboard "permen_api/domain/dashboard/repo"
	"time"
)

type dashboardService struct {
	repo repo_dashboard.DashboardRepo
}

func NewDashboardService(repo repo_dashboard.DashboardRepo) DashboardService {
	return &dashboardService{repo: repo}
}

func (s *dashboardService) GetStats(date string) (*dto_dashboard.StatsResponse, error) {
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	todayStats, err := s.repo.GetTodayStats(date)
	if err != nil {
		return nil, err
	}
	todayExpenses, err := s.repo.GetTodayExpenses(date)
	if err != nil {
		return nil, err
	}
	todayStats.TotalExpenses = todayExpenses
	todayStats.GrossProfit = todayStats.TotalSales - todayExpenses

	monthStats, err := s.repo.GetMonthStats()
	if err != nil {
		return nil, err
	}
	monthExpenses, err := s.repo.GetMonthExpenses()
	if err != nil {
		return nil, err
	}
	monthStats.TotalExpenses = monthExpenses
	monthStats.GrossProfit = monthStats.TotalSales - monthExpenses

	lowStock, err := s.repo.GetLowStockCount()
	if err != nil {
		return nil, err
	}
	openReceivables, err := s.repo.GetOpenReceivablesCount()
	if err != nil {
		return nil, err
	}

	return &dto_dashboard.StatsResponse{
		Today:           *todayStats,
		ThisMonth:       *monthStats,
		LowStockCount:   lowStock,
		OpenReceivables: openReceivables,
	}, nil
}

func (s *dashboardService) GetSalesTrend(period string) ([]dto_dashboard.SalesTrendItem, error) {
	days := 7
	switch period {
	case "30days":
		days = 30
	case "12months":
		days = 365
	}
	items, err := s.repo.GetSalesTrend(days)
	if err != nil {
		return nil, err
	}
	if items == nil {
		items = []dto_dashboard.SalesTrendItem{}
	}
	return items, nil
}

func (s *dashboardService) GetTopProducts(filter dto_dashboard.DateRangeFilter) ([]dto_dashboard.TopProductItem, error) {
	items, err := s.repo.GetTopProducts(filter)
	if err != nil {
		return nil, err
	}
	if items == nil {
		items = []dto_dashboard.TopProductItem{}
	}
	return items, nil
}

func (s *dashboardService) GetTopCategories(filter dto_dashboard.DateRangeFilter) ([]dto_dashboard.TopCategoryItem, error) {
	items, err := s.repo.GetTopCategories(filter)
	if err != nil {
		return nil, err
	}
	if items == nil {
		items = []dto_dashboard.TopCategoryItem{}
	}

	// hitung percentage
	var grandTotal float64
	for _, item := range items {
		grandTotal += item.TotalSales
	}
	if grandTotal > 0 {
		for i := range items {
			items[i].Percentage = (items[i].TotalSales / grandTotal) * 100
		}
	}
	return items, nil
}

func (s *dashboardService) GetPaymentMethods(filter dto_dashboard.DateRangeFilter) ([]dto_dashboard.PaymentMethodItem, error) {
	items, err := s.repo.GetPaymentMethods(filter)
	if err != nil {
		return nil, err
	}
	if items == nil {
		items = []dto_dashboard.PaymentMethodItem{}
	}

	var grandTotal float64
	for _, item := range items {
		grandTotal += item.Total
	}
	if grandTotal > 0 {
		for i := range items {
			items[i].Percentage = (items[i].Total / grandTotal) * 100
		}
	}
	return items, nil
}
