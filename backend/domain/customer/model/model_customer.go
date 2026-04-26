package model_customer

import "time"

type Customer struct {
	ID          int        `db:"id"`
	CustomerCode string    `db:"customer_code"`
	Name        string     `db:"name"`
	Phone       string     `db:"phone"`
	Address     string     `db:"address"`
	CreditLimit float64    `db:"credit_limit"`
	Notes       string     `db:"notes"`
	IsActive    bool       `db:"is_active"`
	CreatedAt   time.Time  `db:"created_at"`
	UpdatedAt   *time.Time `db:"updated_at"`
}
