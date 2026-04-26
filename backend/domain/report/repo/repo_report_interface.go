package repo_report

import dto_report "permen_api/domain/report/dto"

type ReportRepo interface {
	GetSalesItems(params dto_report.FilterParams) ([]dto_report.SalesItem, error)
	GetSalesSummary(params dto_report.FilterParams) (*dto_report.SalesSummary, error)
	GetSalesChart(params dto_report.FilterParams) ([]dto_report.SalesChartItem, error)
	GetProfitLossItems(params dto_report.FilterParams) ([]dto_report.ProfitLossItem, error)
	GetExpenseSummary(params dto_report.FilterParams) ([]dto_report.ExpenseSummaryItem, error)
	GetStockItems() ([]dto_report.StockItem, error)
	GetCashierItems(params dto_report.FilterParams) ([]dto_report.CashierItem, error)
}
