package repo_report

import (
	dto_report "permen_api/domain/report/dto"

	"gorm.io/gorm"
)

const (
	salesReportQuery = `
		SELECT t.id, t.transaction_code, DATE_FORMAT(t.transaction_date, '%Y-%m-%d %H:%i:%s') as transaction_date,
		       u.full_name as user_name, t.total_amount, t.discount, t.payment_method, t.status
		FROM transactions t
		LEFT JOIN users u ON t.user_id = u.id
		WHERE t.status = 'completed' AND t.transaction_date BETWEEN ? AND ?
		ORDER BY t.transaction_date DESC`

	salesSummaryQuery = `
		SELECT COUNT(*) as total_transactions, COALESCE(SUM(total_amount),0) as total_sales,
		       COALESCE(SUM(discount),0) as total_discount, COALESCE(SUM(tax),0) as total_tax
		FROM transactions WHERE status = 'completed' AND transaction_date BETWEEN ? AND ?`

	salesChartQuery = `
		SELECT DATE(transaction_date) as label, COALESCE(SUM(total_amount),0) as total_sales, COUNT(*) as total_transactions
		FROM transactions WHERE status = 'completed' AND transaction_date BETWEEN ? AND ?
		GROUP BY DATE(transaction_date) ORDER BY label`

	profitLossQuery = `
		SELECT ti.product_id, p.name as product_name,
		       SUM(ti.quantity) as qty_sold,
		       p.purchase_price,
		       COALESCE(SUM(ti.quantity * p.purchase_price),0) as total_cogs,
		       COALESCE(SUM(ti.subtotal),0) as total_revenue
		FROM transaction_items ti
		LEFT JOIN products p ON ti.product_id = p.id
		LEFT JOIN transactions t ON ti.transaction_id = t.id
		WHERE t.status = 'completed' AND t.transaction_date BETWEEN ? AND ?
		GROUP BY ti.product_id, p.name, p.purchase_price`

	expenseSummaryQuery = `
		SELECT category, COALESCE(SUM(amount),0) as total
		FROM expenses WHERE expense_date BETWEEN ? AND ?
		GROUP BY category`

	stockReportQuery = `
		SELECT p.id, p.name, COALESCE(c.name,'') as category_name, p.stock, p.min_stock, p.unit,
		       p.purchase_price, (p.stock * p.purchase_price) as stock_value,
		       CASE WHEN p.stock <= p.min_stock THEN 1 ELSE 0 END as is_low_stock
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE p.is_active = 1`

	cashierReportQuery = `
		SELECT t.user_id, u.full_name as user_name,
		       COUNT(t.id) as total_transactions,
		       COALESCE(SUM(t.total_amount),0) as total_sales,
		       COALESCE(SUM(CASE WHEN t.payment_method='cash' THEN t.total_amount ELSE 0 END),0) as total_cash,
		       COALESCE(SUM(CASE WHEN t.payment_method!='cash' THEN t.total_amount ELSE 0 END),0) as total_non_cash,
		       COALESCE(AVG(t.total_amount),0) as avg_transaction
		FROM transactions t
		LEFT JOIN users u ON t.user_id = u.id
		WHERE t.status = 'completed' AND t.transaction_date BETWEEN ? AND ?
		GROUP BY t.user_id, u.full_name
		ORDER BY total_sales DESC`
)

type reportRepo struct {
	db *gorm.DB
}

func NewReportRepo(db *gorm.DB) ReportRepo {
	return &reportRepo{db: db}
}

func (r *reportRepo) GetSalesItems(params dto_report.FilterParams) ([]dto_report.SalesItem, error) {
	rows, err := r.db.Raw(salesReportQuery, params.DateFrom, params.DateTo).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []dto_report.SalesItem
	for rows.Next() {
		var item dto_report.SalesItem
		if err := rows.Scan(&item.ID, &item.TransactionCode, &item.TransactionDate,
			&item.UserName, &item.TotalAmount, &item.Discount, &item.PaymentMethod, &item.Status); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if items == nil {
		items = []dto_report.SalesItem{}
	}
	return items, nil
}

func (r *reportRepo) GetSalesSummary(params dto_report.FilterParams) (*dto_report.SalesSummary, error) {
	var summary dto_report.SalesSummary
	if err := r.db.Raw(salesSummaryQuery, params.DateFrom, params.DateTo).Scan(&summary).Error; err != nil {
		return nil, err
	}
	return &summary, nil
}

func (r *reportRepo) GetSalesChart(params dto_report.FilterParams) ([]dto_report.SalesChartItem, error) {
	rows, err := r.db.Raw(salesChartQuery, params.DateFrom, params.DateTo).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []dto_report.SalesChartItem
	for rows.Next() {
		var item dto_report.SalesChartItem
		if err := rows.Scan(&item.Label, &item.TotalSales, &item.TotalTransactions); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if items == nil {
		items = []dto_report.SalesChartItem{}
	}
	return items, nil
}

func (r *reportRepo) GetProfitLossItems(params dto_report.FilterParams) ([]dto_report.ProfitLossItem, error) {
	rows, err := r.db.Raw(profitLossQuery, params.DateFrom, params.DateTo).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []dto_report.ProfitLossItem
	for rows.Next() {
		var item dto_report.ProfitLossItem
		if err := rows.Scan(&item.ProductID, &item.ProductName, &item.QtySold,
			&item.PurchasePrice, &item.TotalCOGS, &item.TotalRevenue); err != nil {
			return nil, err
		}
		item.GrossProfit = item.TotalRevenue - item.TotalCOGS
		items = append(items, item)
	}
	if items == nil {
		items = []dto_report.ProfitLossItem{}
	}
	return items, nil
}

func (r *reportRepo) GetExpenseSummary(params dto_report.FilterParams) ([]dto_report.ExpenseSummaryItem, error) {
	rows, err := r.db.Raw(expenseSummaryQuery, params.DateFrom, params.DateTo).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []dto_report.ExpenseSummaryItem
	for rows.Next() {
		var item dto_report.ExpenseSummaryItem
		if err := rows.Scan(&item.Category, &item.Total); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if items == nil {
		items = []dto_report.ExpenseSummaryItem{}
	}
	return items, nil
}

func (r *reportRepo) GetStockItems() ([]dto_report.StockItem, error) {
	rows, err := r.db.Raw(stockReportQuery).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []dto_report.StockItem
	for rows.Next() {
		var item dto_report.StockItem
		var isLowInt int
		if err := rows.Scan(&item.ID, &item.Name, &item.CategoryName, &item.Stock, &item.MinStock,
			&item.Unit, &item.PurchasePrice, &item.StockValue, &isLowInt); err != nil {
			return nil, err
		}
		item.IsLowStock = isLowInt == 1
		items = append(items, item)
	}
	if items == nil {
		items = []dto_report.StockItem{}
	}
	return items, nil
}

func (r *reportRepo) GetCashierItems(params dto_report.FilterParams) ([]dto_report.CashierItem, error) {
	rows, err := r.db.Raw(cashierReportQuery, params.DateFrom, params.DateTo).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []dto_report.CashierItem
	for rows.Next() {
		var item dto_report.CashierItem
		if err := rows.Scan(&item.UserID, &item.UserName, &item.TotalTransactions,
			&item.TotalSales, &item.TotalCash, &item.TotalNonCash, &item.AvgTransaction); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if items == nil {
		items = []dto_report.CashierItem{}
	}
	return items, nil
}
