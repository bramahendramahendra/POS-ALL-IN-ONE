package model_supplier_return

import "time"

type SupplierReturn struct {
	ID                int        `db:"id"`
	ReturnCode        string     `db:"return_code"`
	PurchaseID        int        `db:"purchase_id"`
	SupplierID        *int       `db:"supplier_id"`
	SupplierName      string     `db:"supplier_name"`
	ReturnDate        string     `db:"return_date"`
	TotalReturnAmount float64    `db:"total_return_amount"`
	Reason            string     `db:"reason"`
	Status            string     `db:"status"`
	UserID            int        `db:"user_id"`
	Notes             string     `db:"notes"`
	CreatedAt         time.Time  `db:"created_at"`
	UpdatedAt         *time.Time `db:"updated_at"`
}

type SupplierReturnItem struct {
	ID             int     `db:"id"`
	ReturnID       int     `db:"return_id"`
	PurchaseItemID int     `db:"purchase_item_id"`
	ProductID      int     `db:"product_id"`
	ProductName    string  `db:"product_name"`
	Quantity       float64 `db:"quantity"`
	Unit           string  `db:"unit"`
	PurchasePrice  float64 `db:"purchase_price"`
	Subtotal       float64 `db:"subtotal"`
}
