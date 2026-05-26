package model_product_category

import "time"

type Category struct {
	ID                 int       `db:"id"`
	Name               string    `db:"name"`
	Code               string    `db:"code"`
	Description        string    `db:"description"`
	IsActive           bool      `db:"is_active"`
	ProductCount       int       `db:"product_count"`
	ActiveProductCount int       `db:"active_product_count"`
	CreatedAt          time.Time `db:"created_at"`
	UpdatedAt          time.Time `db:"updated_at"`
}
