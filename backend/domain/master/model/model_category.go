package model_master

import "time"

type Category struct {
	ID           int       `db:"id"`
	Name         string    `db:"name"`
	Code         string    `db:"code"`
	Description  string    `db:"description"`
	ProductCount int       `db:"product_count"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}
