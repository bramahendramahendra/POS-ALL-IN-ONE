package model_payment_status

import "time"

type PaymentStatus struct {
	ID        int        `db:"id"`
	Code      string     `db:"code"`
	Label     string     `db:"label"`
	IsActive  int        `db:"is_active"`
	SortOrder int        `db:"sort_order"`
	CreatedAt time.Time  `db:"created_at"`
	UpdatedAt *time.Time `db:"updated_at"`
}
