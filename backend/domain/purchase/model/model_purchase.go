package model_purchase

import "time"

type Purchase struct {
	ID              int        `db:"id"`
	PurchaseCode    string     `db:"purchase_code"`
	SupplierID      *int       `db:"supplier_id"`
	SupplierName    string     `db:"supplier_name"`
	PurchaseDate    string     `db:"purchase_date"`
	TotalAmount     float64    `db:"total_amount"`
	PaymentStatus   string     `db:"payment_status"`
	PaidAmount      float64    `db:"paid_amount"`
	RemainingAmount float64    `db:"remaining_amount"`
	UserID          int        `db:"user_id"`
	Notes           string     `db:"notes"`
	CreatedAt       time.Time  `db:"created_at"`
	UpdatedAt       *time.Time `db:"updated_at"`
}

type PurchaseItem struct {
	ID            int     `db:"id"`
	PurchaseID    int     `db:"purchase_id"`
	ProductID     int     `db:"product_id"`
	ProductName   string  `db:"product_name"`
	Quantity      float64 `db:"quantity"`
	Unit          string  `db:"unit"`
	PurchasePrice float64 `db:"purchase_price"`
	Subtotal      float64 `db:"subtotal"`
}
