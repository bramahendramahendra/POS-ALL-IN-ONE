package repo_dashboard

import (
	"fmt"

	dto_dashboard "permen_api/domain/dashboard/dto"

	"gorm.io/gorm"
)

const (
	todayStatsQuery = `
		SELECT COUNT(*) as total_transactions, COALESCE(SUM(total_amount),0) as total_sales,
		       COALESCE(SUM(discount),0) as total_discount
		FROM transactions WHERE DATE(transaction_date) = ? AND status = 'completed'`

	todayExpensesQuery = `SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE expense_date = ?`

	monthStatsQuery = `
		SELECT COUNT(*) as total_transactions, COALESCE(SUM(total_amount),0) as total_sales
		FROM transactions WHERE MONTH(transaction_date) = MONTH(NOW())
		AND YEAR(transaction_date) = YEAR(NOW()) AND status = 'completed'`

	monthExpensesQuery = `
		SELECT COALESCE(SUM(amount),0) as total FROM expenses
		WHERE MONTH(expense_date) = MONTH(NOW()) AND YEAR(expense_date) = YEAR(NOW())`

	salesTrendQuery = `
		SELECT DATE(transaction_date) as label,
		       COALESCE(SUM(total_amount),0) as total_sales,
		       COUNT(*) as total_transactions
		FROM transactions
		WHERE transaction_date >= DATE_SUB(NOW(), INTERVAL ? DAY) AND status = 'completed'
		GROUP BY DATE(transaction_date) ORDER BY label`

	topProductsQuery = `
		SELECT ti.product_id, p.name as product_name,
		       SUM(ti.quantity) as total_qty,
		       SUM(ti.subtotal) as total_value
		FROM transaction_items ti
		LEFT JOIN products p ON ti.product_id = p.id
		LEFT JOIN transactions t ON ti.transaction_id = t.id
		WHERE t.transaction_date BETWEEN ? AND ? AND t.status = 'completed'
		GROUP BY ti.product_id, p.name
		ORDER BY total_qty DESC LIMIT ?`

	topProductsByValueQuery = `
		SELECT ti.product_id, p.name as product_name,
		       SUM(ti.quantity) as total_qty,
		       SUM(ti.subtotal) as total_value
		FROM transaction_items ti
		LEFT JOIN products p ON ti.product_id = p.id
		LEFT JOIN transactions t ON ti.transaction_id = t.id
		WHERE t.transaction_date BETWEEN ? AND ? AND t.status = 'completed'
		GROUP BY ti.product_id, p.name
		ORDER BY total_value DESC LIMIT ?`

	topCategoriesQuery = `
		SELECT c.id as category_id, c.name as category_name,
		       SUM(ti.subtotal) as total_sales
		FROM transaction_items ti
		LEFT JOIN products p ON ti.product_id = p.id
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN transactions t ON ti.transaction_id = t.id
		WHERE t.transaction_date BETWEEN ? AND ? AND t.status = 'completed'
		GROUP BY c.id, c.name ORDER BY total_sales DESC LIMIT ?`

	paymentMethodsQuery = `
		SELECT payment_method, COUNT(*) as count, SUM(total_amount) as total
		FROM transactions WHERE transaction_date BETWEEN ? AND ? AND status = 'completed'
		GROUP BY payment_method`

	lowStockCountQuery          = `SELECT COUNT(*) FROM products WHERE stock <= min_stock AND is_active = 1`
	openReceivablesCountQuery   = `SELECT COUNT(*) FROM receivables WHERE status != 'paid'`
)

type dashboardRepo struct {
	db *gorm.DB
}

func NewDashboardRepo(db *gorm.DB) DashboardRepo {
	return &dashboardRepo{db: db}
}

func (r *dashboardRepo) GetTodayStats(date string) (*dto_dashboard.TodayStats, error) {
	var result dto_dashboard.TodayStats
	row := r.db.Raw(todayStatsQuery, date).Row()
	if err := row.Scan(&result.TotalTransactions, &result.TotalSales, &result.TotalDiscount); err != nil {
		return nil, fmt.Errorf("GetTodayStats: %w", err)
	}
	return &result, nil
}

func (r *dashboardRepo) GetTodayExpenses(date string) (float64, error) {
	var total float64
	row := r.db.Raw(todayExpensesQuery, date).Row()
	if err := row.Scan(&total); err != nil {
		return 0, fmt.Errorf("GetTodayExpenses: %w", err)
	}
	return total, nil
}

func (r *dashboardRepo) GetMonthStats() (*dto_dashboard.MonthStats, error) {
	var result dto_dashboard.MonthStats
	row := r.db.Raw(monthStatsQuery).Row()
	if err := row.Scan(&result.TotalTransactions, &result.TotalSales); err != nil {
		return nil, fmt.Errorf("GetMonthStats: %w", err)
	}
	return &result, nil
}

func (r *dashboardRepo) GetMonthExpenses() (float64, error) {
	var total float64
	row := r.db.Raw(monthExpensesQuery).Row()
	if err := row.Scan(&total); err != nil {
		return 0, fmt.Errorf("GetMonthExpenses: %w", err)
	}
	return total, nil
}

func (r *dashboardRepo) GetLowStockCount() (int64, error) {
	var count int64
	row := r.db.Raw(lowStockCountQuery).Row()
	if err := row.Scan(&count); err != nil {
		return 0, fmt.Errorf("GetLowStockCount: %w", err)
	}
	return count, nil
}

func (r *dashboardRepo) GetOpenReceivablesCount() (int64, error) {
	var count int64
	row := r.db.Raw(openReceivablesCountQuery).Row()
	if err := row.Scan(&count); err != nil {
		return 0, fmt.Errorf("GetOpenReceivablesCount: %w", err)
	}
	return count, nil
}

func (r *dashboardRepo) GetSalesTrend(days int) ([]dto_dashboard.SalesTrendItem, error) {
	rows, err := r.db.Raw(salesTrendQuery, days).Rows()
	if err != nil {
		return nil, fmt.Errorf("GetSalesTrend: %w", err)
	}
	defer rows.Close()

	var items []dto_dashboard.SalesTrendItem
	for rows.Next() {
		var item dto_dashboard.SalesTrendItem
		if err := rows.Scan(&item.Label, &item.TotalSales, &item.TotalTransactions); err != nil {
			return nil, fmt.Errorf("GetSalesTrend scan: %w", err)
		}
		items = append(items, item)
	}
	return items, nil
}

func (r *dashboardRepo) GetTopProducts(filter dto_dashboard.DateRangeFilter) ([]dto_dashboard.TopProductItem, error) {
	q := topProductsQuery
	if filter.SortBy == "value" {
		q = topProductsByValueQuery
	}
	rows, err := r.db.Raw(q, filter.StartDate, filter.EndDate, filter.Limit).Rows()
	if err != nil {
		return nil, fmt.Errorf("GetTopProducts: %w", err)
	}
	defer rows.Close()

	var items []dto_dashboard.TopProductItem
	for rows.Next() {
		var item dto_dashboard.TopProductItem
		if err := rows.Scan(&item.ProductID, &item.ProductName, &item.TotalQty, &item.TotalValue); err != nil {
			return nil, fmt.Errorf("GetTopProducts scan: %w", err)
		}
		items = append(items, item)
	}
	return items, nil
}

func (r *dashboardRepo) GetTopCategories(filter dto_dashboard.DateRangeFilter) ([]dto_dashboard.TopCategoryItem, error) {
	rows, err := r.db.Raw(topCategoriesQuery, filter.StartDate, filter.EndDate, filter.Limit).Rows()
	if err != nil {
		return nil, fmt.Errorf("GetTopCategories: %w", err)
	}
	defer rows.Close()

	var items []dto_dashboard.TopCategoryItem
	for rows.Next() {
		var item dto_dashboard.TopCategoryItem
		if err := rows.Scan(&item.CategoryID, &item.CategoryName, &item.TotalSales); err != nil {
			return nil, fmt.Errorf("GetTopCategories scan: %w", err)
		}
		items = append(items, item)
	}
	return items, nil
}

func (r *dashboardRepo) GetPaymentMethods(filter dto_dashboard.DateRangeFilter) ([]dto_dashboard.PaymentMethodItem, error) {
	rows, err := r.db.Raw(paymentMethodsQuery, filter.StartDate, filter.EndDate).Rows()
	if err != nil {
		return nil, fmt.Errorf("GetPaymentMethods: %w", err)
	}
	defer rows.Close()

	var items []dto_dashboard.PaymentMethodItem
	for rows.Next() {
		var item dto_dashboard.PaymentMethodItem
		if err := rows.Scan(&item.PaymentMethod, &item.Count, &item.Total); err != nil {
			return nil, fmt.Errorf("GetPaymentMethods scan: %w", err)
		}
		items = append(items, item)
	}
	return items, nil
}
