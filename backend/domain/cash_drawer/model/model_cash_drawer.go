package model_cash_drawer

import "time"

type CashDrawer struct {
	ID              int        `json:"id"`
	UserID          int        `json:"user_id"`
	ShiftID         *int       `json:"shift_id"`
	OpenTime        time.Time  `json:"open_time"`
	CloseTime       *time.Time `json:"close_time"`
	OpeningBalance  float64    `json:"opening_balance"`
	ClosingBalance  *float64   `json:"closing_balance"`
	TotalSales      float64    `json:"total_sales"`
	TotalCashSales  float64    `json:"total_cash_sales"`
	TotalExpenses   float64    `json:"total_expenses"`
	ExpectedBalance float64    `json:"expected_balance"`
	Difference      *float64   `json:"difference"`
	Status          string     `json:"status"`
	Notes           *string    `json:"notes"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}
