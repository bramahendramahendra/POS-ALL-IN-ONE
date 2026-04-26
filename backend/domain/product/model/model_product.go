package model_product

import "time"

type Product struct {
	ID            int       `db:"id"`
	Barcode       string    `db:"barcode"`
	Name          string    `db:"name"`
	CategoryID    *int      `db:"category_id"`
	PurchasePrice float64   `db:"purchase_price"`
	SellingPrice  float64   `db:"selling_price"`
	Stock         float64   `db:"stock"`
	MinStock      float64   `db:"min_stock"`
	Unit          string    `db:"unit"`
	IsActive      bool      `db:"is_active"`
	CreatedAt     time.Time `db:"created_at"`
	UpdatedAt     time.Time `db:"updated_at"`
}
