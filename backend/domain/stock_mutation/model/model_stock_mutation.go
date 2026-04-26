package model_stock_mutation

import "time"

type StockMutation struct {
	ID            int       `db:"id"`
	ProductID     int       `db:"product_id"`
	MutationType  string    `db:"mutation_type"`
	Quantity      float64   `db:"quantity"`
	StockBefore   float64   `db:"stock_before"`
	StockAfter    float64   `db:"stock_after"`
	ReferenceType string    `db:"reference_type"`
	ReferenceID   int       `db:"reference_id"`
	Notes         string    `db:"notes"`
	UserID        int       `db:"user_id"`
	CreatedAt     time.Time `db:"created_at"`
}
