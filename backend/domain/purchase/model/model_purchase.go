package model_purchase

import "time"

type Purchase struct {
	ID              int        `db:"id"`
	PurchaseCode    string     `db:"purchase_code"`
	InvoiceNumber   string     `db:"invoice_number"`
	SupplierID      *int       `db:"supplier_id"`
	PurchaseDate    string     `db:"purchase_date"`
	DiscountAmount  float64    `db:"discount_amount"`
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
	ConversionQty float64 `db:"conversion_qty"`
	PurchasePrice float64 `db:"purchase_price"`
	Subtotal      float64 `db:"subtotal"`
}

type PurchasePayment struct {
	ID          int     `db:"id"`
	PurchaseID  int     `db:"purchase_id"`
	PaymentDate string  `db:"payment_date"`
	Amount      float64 `db:"amount"`
	Notes       string  `db:"notes"`
	UserName    string  `db:"user_name"`
	CreatedAt   string  `db:"created_at"`
}
