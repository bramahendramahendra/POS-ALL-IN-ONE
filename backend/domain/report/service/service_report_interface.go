package service_report

import (
	"bytes"

	dto_report "permen_api/domain/report/dto"
)

type ReportService interface {
	GetSalesReport(params dto_report.FilterParams) (*dto_report.SalesReportResponse, error)
	GetSalesChart(params dto_report.FilterParams) ([]dto_report.SalesChartItem, error)
	ExportSalesReport(params dto_report.FilterParams) (*bytes.Buffer, error)

	GetProfitLoss(params dto_report.FilterParams) (*dto_report.ProfitLossResponse, error)
	ExportProfitLoss(params dto_report.FilterParams) (*bytes.Buffer, error)

	GetStockReport() (*dto_report.StockReportResponse, error)
	ExportStockReport() (*bytes.Buffer, error)

	GetCashierReport(params dto_report.FilterParams) ([]dto_report.CashierItem, error)
	ExportCashierReport(params dto_report.FilterParams) (*bytes.Buffer, error)
}
