package model_product

import "time"

type Product struct {
	ID               int       `db:"id"`
	Barcode          string    `db:"barcode"`
	SKU              string    `db:"sku"`
	Name             string    `db:"name"`
	CategoryID       *int      `db:"category_id"`
	CategoryName     string    `db:"category_name"`
	PurchasePrice    float64   `db:"purchase_price"`
	SellingPrice     float64   `db:"selling_price"`
	Stock            float64   `db:"stock"`
	MinStock         float64   `db:"min_stock"`
	UnitID           int       `db:"unit_id"`
	UnitName         string    `db:"unit_name"`
	UnitAbbreviation string    `db:"unit_abbreviation"`
	IsActive         bool      `db:"is_active"`
	CreatedAt        time.Time `db:"created_at"`
	UpdatedAt        time.Time `db:"updated_at"`
}
