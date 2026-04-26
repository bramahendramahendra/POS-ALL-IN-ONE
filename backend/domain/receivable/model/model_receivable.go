package model_receivable

import "time"

type Receivable struct {
	ID              int        `db:"id"`
	TransactionID   int        `db:"transaction_id"`
	CustomerID      int        `db:"customer_id"`
	TotalAmount     float64    `db:"total_amount"`
	PaidAmount      float64    `db:"paid_amount"`
	RemainingAmount float64    `db:"remaining_amount"`
	Status          string     `db:"status"`
	DueDate         *time.Time `db:"due_date"`
	CreatedAt       time.Time  `db:"created_at"`
	UpdatedAt       *time.Time `db:"updated_at"`
}

type ReceivablePayment struct {
	ID            int        `db:"id"`
	ReceivableID  int        `db:"receivable_id"`
	PaymentDate   time.Time  `db:"payment_date"`
	Amount        float64    `db:"amount"`
	PaymentMethod string     `db:"payment_method"`
	Notes         string     `db:"notes"`
	UserID        int        `db:"user_id"`
	CreatedAt     time.Time  `db:"created_at"`
}
