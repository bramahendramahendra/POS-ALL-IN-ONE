package service_report

import (
	"bytes"
	"fmt"

	dto_report "permen_api/domain/report/dto"
	repo_report "permen_api/domain/report/repo"

	"github.com/xuri/excelize/v2"
)

type reportService struct {
	repo repo_report.ReportRepo
}

func NewReportService(repo repo_report.ReportRepo) ReportService {
	return &reportService{repo: repo}
}

// ─── Sales ─────────────────────────────────────────────────────

func (s *reportService) GetSalesReport(params dto_report.FilterParams) (*dto_report.SalesReportResponse, error) {
	items, err := s.repo.GetSalesItems(params)
	if err != nil {
		return nil, err
	}
	summary, err := s.repo.GetSalesSummary(params)
	if err != nil {
		return nil, err
	}
	return &dto_report.SalesReportResponse{Summary: *summary, Items: items}, nil
}

func (s *reportService) GetSalesChart(params dto_report.FilterParams) ([]dto_report.SalesChartItem, error) {
	return s.repo.GetSalesChart(params)
}

func (s *reportService) ExportSalesReport(params dto_report.FilterParams) (*bytes.Buffer, error) {
	data, err := s.GetSalesReport(params)
	if err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	sheet := "Laporan Penjualan"
	f.SetSheetName("Sheet1", sheet)

	headers := []string{"No", "Kode Transaksi", "Tanggal", "Kasir", "Total", "Diskon", "Metode Bayar", "Status"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}
	applyHeaderStyle(f, sheet, len(headers))

	for idx, item := range data.Items {
		row := idx + 2
		vals := []interface{}{idx + 1, item.TransactionCode, item.TransactionDate, item.UserName,
			item.TotalAmount, item.Discount, item.PaymentMethod, item.Status}
		for col, v := range vals {
			cell, _ := excelize.CoordinatesToCellName(col+1, row)
			f.SetCellValue(sheet, cell, v)
		}
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf, nil
}

// ─── Profit/Loss ────────────────────────────────────────────────

func (s *reportService) GetProfitLoss(params dto_report.FilterParams) (*dto_report.ProfitLossResponse, error) {
	items, err := s.repo.GetProfitLossItems(params)
	if err != nil {
		return nil, err
	}
	expenses, err := s.repo.GetExpenseSummary(params)
	if err != nil {
		return nil, err
	}

	var totalRevenue, totalCOGS, totalExpenses float64
	for _, item := range items {
		totalRevenue += item.TotalRevenue
		totalCOGS += item.TotalCOGS
	}
	for _, exp := range expenses {
		totalExpenses += exp.Total
	}
	grossProfit := totalRevenue - totalCOGS
	netProfit := grossProfit - totalExpenses

	return &dto_report.ProfitLossResponse{
		TotalRevenue:  totalRevenue,
		TotalCOGS:     totalCOGS,
		GrossProfit:   grossProfit,
		TotalExpenses: totalExpenses,
		NetProfit:     netProfit,
		Items:         items,
		Expenses:      expenses,
	}, nil
}

func (s *reportService) ExportProfitLoss(params dto_report.FilterParams) (*bytes.Buffer, error) {
	data, err := s.GetProfitLoss(params)
	if err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	sheet := "Laba Rugi"
	f.SetSheetName("Sheet1", sheet)

	headers := []string{"No", "Produk", "Qty Terjual", "Harga Beli", "Total HPP", "Total Penjualan", "Laba Kotor"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}
	applyHeaderStyle(f, sheet, len(headers))

	for idx, item := range data.Items {
		row := idx + 2
		vals := []interface{}{idx + 1, item.ProductName, item.QtySold, item.PurchasePrice,
			item.TotalCOGS, item.TotalRevenue, item.GrossProfit}
		for col, v := range vals {
			cell, _ := excelize.CoordinatesToCellName(col+1, row)
			f.SetCellValue(sheet, cell, v)
		}
	}

	summaryRow := len(data.Items) + 3
	f.SetCellValue(sheet, fmt.Sprintf("A%d", summaryRow), "Total Pendapatan")
	f.SetCellValue(sheet, fmt.Sprintf("B%d", summaryRow), data.TotalRevenue)
	f.SetCellValue(sheet, fmt.Sprintf("A%d", summaryRow+1), "Total HPP")
	f.SetCellValue(sheet, fmt.Sprintf("B%d", summaryRow+1), data.TotalCOGS)
	f.SetCellValue(sheet, fmt.Sprintf("A%d", summaryRow+2), "Laba Kotor")
	f.SetCellValue(sheet, fmt.Sprintf("B%d", summaryRow+2), data.GrossProfit)
	f.SetCellValue(sheet, fmt.Sprintf("A%d", summaryRow+3), "Total Beban")
	f.SetCellValue(sheet, fmt.Sprintf("B%d", summaryRow+3), data.TotalExpenses)
	f.SetCellValue(sheet, fmt.Sprintf("A%d", summaryRow+4), "Laba Bersih")
	f.SetCellValue(sheet, fmt.Sprintf("B%d", summaryRow+4), data.NetProfit)

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf, nil
}

// ─── Stock ──────────────────────────────────────────────────────

func (s *reportService) GetStockReport() (*dto_report.StockReportResponse, error) {
	items, err := s.repo.GetStockItems()
	if err != nil {
		return nil, err
	}

	var totalValue float64
	lowCount := 0
	for _, item := range items {
		totalValue += item.StockValue
		if item.IsLowStock {
			lowCount++
		}
	}

	return &dto_report.StockReportResponse{
		TotalProducts:   len(items),
		LowStockCount:   lowCount,
		TotalStockValue: totalValue,
		Items:           items,
	}, nil
}

func (s *reportService) ExportStockReport() (*bytes.Buffer, error) {
	data, err := s.GetStockReport()
	if err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	sheet := "Laporan Stok"
	f.SetSheetName("Sheet1", sheet)

	headers := []string{"No", "Nama Produk", "Kategori", "Stok", "Stok Min", "Satuan", "Harga Beli", "Nilai Stok", "Status"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}
	applyHeaderStyle(f, sheet, len(headers))

	for idx, item := range data.Items {
		row := idx + 2
		status := "Normal"
		if item.IsLowStock {
			status = "Stok Rendah"
		}
		vals := []interface{}{idx + 1, item.Name, item.CategoryName, item.Stock, item.MinStock,
			item.Unit, item.PurchasePrice, item.StockValue, status}
		for col, v := range vals {
			cell, _ := excelize.CoordinatesToCellName(col+1, row)
			f.SetCellValue(sheet, cell, v)
		}
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf, nil
}

// ─── Cashier ────────────────────────────────────────────────────

func (s *reportService) GetCashierReport(params dto_report.FilterParams) ([]dto_report.CashierItem, error) {
	return s.repo.GetCashierItems(params)
}

func (s *reportService) ExportCashierReport(params dto_report.FilterParams) (*bytes.Buffer, error) {
	items, err := s.GetCashierReport(params)
	if err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	sheet := "Laporan Kasir"
	f.SetSheetName("Sheet1", sheet)

	headers := []string{"No", "Kasir", "Total Transaksi", "Total Penjualan", "Total Tunai", "Total Non-Tunai", "Rata-rata Transaksi"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}
	applyHeaderStyle(f, sheet, len(headers))

	for idx, item := range items {
		row := idx + 2
		vals := []interface{}{idx + 1, item.UserName, item.TotalTransactions, item.TotalSales,
			item.TotalCash, item.TotalNonCash, item.AvgTransaction}
		for col, v := range vals {
			cell, _ := excelize.CoordinatesToCellName(col+1, row)
			f.SetCellValue(sheet, cell, v)
		}
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf, nil
}

// ─── Helper ─────────────────────────────────────────────────────

func applyHeaderStyle(f *excelize.File, sheet string, colCount int) {
	style, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"2E75B6"}, Pattern: 1},
	})
	end, _ := excelize.CoordinatesToCellName(colCount, 1)
	f.SetCellStyle(sheet, "A1", end, style)
}
