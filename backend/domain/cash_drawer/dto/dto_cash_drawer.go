package dto_cash_drawer

import "time"

// Request DTOs

type OpenRequest struct {
	ShiftID        *int    `json:"shift_id"`
	OpeningBalance float64 `json:"opening_balance" binding:"required"`
}

type CloseRequest struct {
	ClosingBalance float64 `json:"closing_balance" binding:"required"`
	Notes          string  `json:"notes"`
}

type UpdateSalesRequest struct {
	TotalSales     float64 `json:"total_sales" binding:"required"`
	TotalCashSales float64 `json:"total_cash_sales" binding:"required"`
}

type UpdateExpensesRequest struct {
	TotalExpenses float64 `json:"total_expenses" binding:"required"`
}

// Filter

type CashDrawerFilter struct {
	StartDate string
	EndDate   string
	UserID    *int
	Status    string
	Page      int
	Limit     int
}

// Response DTOs

type CurrentCashDrawerResponse struct {
	ID              int        `json:"id"`
	UserID          int        `json:"user_id"`
	UserName        string     `json:"user_name"`
	ShiftID         *int       `json:"shift_id"`
	ShiftName       *string    `json:"shift_name"`
	OpenTime        time.Time  `json:"open_time"`
	OpeningBalance  float64    `json:"opening_balance"`
	TotalSales      float64    `json:"total_sales"`
	TotalCashSales  float64    `json:"total_cash_sales"`
	TotalExpenses   float64    `json:"total_expenses"`
	ExpectedBalance float64    `json:"expected_balance"`
	Status          string     `json:"status"`
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
	Status          string     `json:"status"`
}

type OpenResponse struct {
	ID int `json:"id"`
}

type CloseResponse struct {
	ExpectedBalance float64 `json:"expected_balance"`
	ClosingBalance  float64 `json:"closing_balance"`
	Difference      float64 `json:"difference"`
}
