package dto_cash_drawer

import "time"

// Request DTOs

type OpenRequest struct {
	ShiftID        *int    `json:"shift_id"`
	OpeningBalance float64 `json:"opening_balance" binding:"min=0"`
	Notes          string  `json:"notes"`
}

type CloseRequest struct {
	ClosingBalance float64 `json:"closing_balance" binding:"min=0"`
	Notes          string  `json:"notes"`
}

type UpdateSalesRequest struct {
	TotalSales     float64 `json:"total_sales" binding:"min=0"`
	TotalCashSales float64 `json:"total_cash_sales" binding:"min=0"`
}

type UpdateExpensesRequest struct {
	TotalExpenses float64 `json:"total_expenses" binding:"min=0"`
}

// Filter

type CashDrawerFilter struct {
	StartDate string
	EndDate   string
	UserID    *int
	ShiftID   *int
	Status    string
	Page      int
	Limit     int
}

// Response DTOs

type CurrentCashDrawerResponse struct {
	ID              int       `json:"id"`
	UserID          int       `json:"user_id"`
	UserName        string    `json:"user_name"`
	ShiftID         *int      `json:"shift_id"`
	ShiftName       *string   `json:"shift_name"`
	ShiftStart      *string   `json:"shift_start"`
	ShiftEnd        *string   `json:"shift_end"`
	OpenTime        time.Time `json:"open_time"`
	OpeningBalance  float64   `json:"opening_balance"`
	TotalSales      float64   `json:"total_sales"`
	TotalCashSales  float64   `json:"total_cash_sales"`
	TotalExpenses   float64   `json:"total_expenses"`
	ExpectedBalance float64   `json:"expected_balance"`
	Status          string    `json:"status"`
	OpenNotes       *string   `json:"open_notes"`
}

type CashDrawerHistoryResponse struct {
	ID              int        `json:"id"`
	UserName        string     `json:"user_name"`
	ShiftName       *string    `json:"shift_name"`
	OpenTime        time.Time  `json:"open_time"`
	CloseTime       *time.Time `json:"close_time"`
	OpeningBalance  float64    `json:"opening_balance"`
	ClosingBalance  *float64   `json:"closing_balance"`
	ExpectedBalance float64    `json:"expected_balance"`
	Difference      *float64   `json:"difference"`
	TotalSales      float64    `json:"total_sales"`
	TotalCashSales  float64    `json:"total_cash_sales"`
	TotalExpenses   float64    `json:"total_expenses"`
	Status          string     `json:"status"`
}

// Detail items

type CashDrawerTransaction struct {
	TransactionDate time.Time `json:"transaction_date"`
	TransactionCode string    `json:"transaction_code"`
	CustomerName    string    `json:"customer_name"`
	TotalAmount     float64   `json:"total_amount"`
}

type CashDrawerExpenseItem struct {
	Category    string  `json:"category"`
	Description string  `json:"description"`
	Amount      float64 `json:"amount"`
}

type CashDrawerDetailResponse struct {
	ID              int                     `json:"id"`
	UserID          int                     `json:"-"`
	CashierName     string                  `json:"cashier_name"`
	ShiftName       *string                 `json:"shift_name"`
	ShiftStart      *string                 `json:"shift_start"`
	ShiftEnd        *string                 `json:"shift_end"`
	OpenTime        time.Time               `json:"open_time"`
	CloseTime       *time.Time              `json:"close_time"`
	OpeningBalance  float64                 `json:"opening_balance"`
	ClosingBalance  *float64                `json:"closing_balance"`
	ExpectedBalance float64                 `json:"expected_balance"`
	TotalCashSales  float64                 `json:"total_cash_sales"`
	TotalExpenses   float64                 `json:"total_expenses"`
	Difference      *float64                `json:"difference"`
	Status          string                  `json:"status"`
	Notes           *string                 `json:"notes"`
	OpenNotes       *string                 `json:"open_notes"`
	Transactions    []CashDrawerTransaction `json:"transactions"`
	Expenses        []CashDrawerExpenseItem `json:"expenses"`
}

type OpenResponse struct {
	ID int `json:"id"`
}

type CloseResponse struct {
	ExpectedBalance float64 `json:"expected_balance"`
	ClosingBalance  float64 `json:"closing_balance"`
	Difference      float64 `json:"difference"`
}
