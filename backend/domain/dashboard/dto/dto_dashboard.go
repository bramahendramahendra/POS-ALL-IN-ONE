package dto_dashboard

type TodayStats struct {
	TotalTransactions int64   `json:"total_transactions"`
	TotalSales        float64 `json:"total_sales"`
	TotalDiscount     float64 `json:"total_discount"`
	TotalExpenses     float64 `json:"total_expenses"`
	GrossProfit       float64 `json:"gross_profit"`
}

type MonthStats struct {
	TotalTransactions int64   `json:"total_transactions"`
	TotalSales        float64 `json:"total_sales"`
	TotalExpenses     float64 `json:"total_expenses"`
	GrossProfit       float64 `json:"gross_profit"`
}

type StatsResponse struct {
	Today             TodayStats `json:"today"`
	ThisMonth         MonthStats `json:"this_month"`
	LowStockCount     int64      `json:"low_stock_count"`
	OpenReceivables   int64      `json:"open_receivables"`
}

type SalesTrendItem struct {
	Label             string  `json:"label"`
	TotalSales        float64 `json:"total_sales"`
	TotalTransactions int64   `json:"total_transactions"`
}

type TopProductItem struct {
	ProductID   int64   `json:"product_id"`
	ProductName string  `json:"product_name"`
	TotalQty    float64 `json:"total_qty"`
	TotalValue  float64 `json:"total_value"`
}

type TopCategoryItem struct {
	CategoryID   int64   `json:"category_id"`
	CategoryName string  `json:"category_name"`
	TotalSales   float64 `json:"total_sales"`
	Percentage   float64 `json:"percentage"`
}

type PaymentMethodItem struct {
	PaymentMethod string  `json:"payment_method"`
	Total         float64 `json:"total"`
	Count         int64   `json:"count"`
	Percentage    float64 `json:"percentage"`
}

type SalesTrendFilter struct {
	Period string // "7days", "30days", "12months"
}

type DateRangeFilter struct {
	StartDate string
	EndDate   string
	Limit     int
	SortBy    string
}
