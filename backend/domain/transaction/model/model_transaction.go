package model_transaction

import "time"

type Transaction struct {
	ID            int        `db:"id"`
	TransactionCode string   `db:"transaction_code"`
	UserID        int        `db:"user_id"`
	ShiftID       *int       `db:"shift_id"`
	TransactionDate time.Time `db:"transaction_date"`
	Subtotal      float64    `db:"subtotal"`
	Discount      float64    `db:"discount"`
	Tax           float64    `db:"tax"`
	TotalAmount   float64    `db:"total_amount"`
	PaymentMethod string     `db:"payment_method"`
	PaymentAmount float64    `db:"payment_amount"`
	ChangeAmount  float64    `db:"change_amount"`
	CustomerID    *int       `db:"customer_id"`
	IsCredit      bool       `db:"is_credit"`
	Status        string     `db:"status"`
	DeviceSource  string     `db:"device_source"`
	CreatedAt     time.Time  `db:"created_at"`
	UpdatedAt     time.Time  `db:"updated_at"`
}

type TransactionItem struct {
	ID             int     `db:"id"`
	TransactionID  int     `db:"transaction_id"`
	ProductID      int     `db:"product_id"`
	ProductName    string  `db:"product_name"`
	Quantity       float64 `db:"quantity"`
	Unit           string  `db:"unit"`
	Price          float64 `db:"price"`
	Subtotal       float64 `db:"subtotal"`
	DiscountItem   float64 `db:"discount_item"`
	ConversionQty  float64 `db:"conversion_qty"`
	UnitID         *int    `db:"unit_id"`
}

type StockMutation struct {
	ID            int     `db:"id"`
	ProductID     int     `db:"product_id"`
	MutationType  string  `db:"mutation_type"`
	Quantity      float64 `db:"quantity"`
	StockBefore   float64 `db:"stock_before"`
	StockAfter    float64 `db:"stock_after"`
	ReferenceType string  `db:"reference_type"`
	ReferenceID   int     `db:"reference_id"`
	Notes         string  `db:"notes"`
	UserID        int     `db:"user_id"`
}
