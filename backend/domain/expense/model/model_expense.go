package model_expense

import "time"

type Expense struct {
	ID            int        `db:"id"`
	ExpenseDate   string     `db:"expense_date"`
	Category      string     `db:"category"`
	Description   string     `db:"description"`
	Amount        float64    `db:"amount"`
	PaymentMethod string     `db:"payment_method"`
	UserID        int        `db:"user_id"`
	Notes         string     `db:"notes"`
	CreatedAt     time.Time  `db:"created_at"`
	UpdatedAt     *time.Time `db:"updated_at"`
}
