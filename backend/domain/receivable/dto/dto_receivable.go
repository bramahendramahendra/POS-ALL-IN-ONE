package dto_receivable

import "time"

type ReceivableFilter struct {
	Search   string
	Status   string
	Page     int
	Limit    int
}

type ReceivableResponse struct {
	ID              int        `json:"id"`
	TransactionCode string     `json:"transaction_code"`
	CustomerName    string     `json:"customer_name"`
	TotalAmount     float64    `json:"total_amount"`
	PaidAmount      float64    `json:"paid_amount"`
	RemainingAmount float64    `json:"remaining_amount"`
	Status          string     `json:"status"`
	DueDate         *time.Time `json:"due_date"`
}

type ReceivableDetailResponse struct {
	ID              int        `json:"id"`
	TransactionCode string     `json:"transaction_code"`
	CustomerName    string     `json:"customer_name"`
	TotalAmount     float64    `json:"total_amount"`
	PaidAmount      float64    `json:"paid_amount"`
	RemainingAmount float64    `json:"remaining_amount"`
	Status          string     `json:"status"`
	DueDate         *time.Time `json:"due_date"`
}

type ReceivableSummaryItem struct {
	CustomerID      int     `json:"customer_id"`
	CustomerName    string  `json:"customer_name"`
	TotalReceivable float64 `json:"total_receivable"`
	TotalPaid       float64 `json:"total_paid"`
	TotalRemaining  float64 `json:"total_remaining"`
	Count           int     `json:"count"`
}

type PaymentResponse struct {
	ID            int       `json:"id"`
	PaymentDate   time.Time `json:"payment_date"`
	Amount        float64   `json:"amount"`
	PaymentMethod string    `json:"payment_method"`
	UserName      string    `json:"user_name"`
	Notes         string    `json:"notes"`
}

type PayRequest struct {
	Amount        float64 `json:"amount" validate:"required,gt=0"`
	PaymentMethod string  `json:"payment_method" validate:"required"`
	Notes         string  `json:"notes"`
}

type PayResponse struct {
	ReceivableID    int     `json:"receivable_id"`
	PaidAmount      float64 `json:"paid_amount"`
	RemainingAmount float64 `json:"remaining_amount"`
	Status          string  `json:"status"`
}
