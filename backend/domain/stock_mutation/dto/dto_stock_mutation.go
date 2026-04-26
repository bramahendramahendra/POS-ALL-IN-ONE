package dto_stock_mutation

import "time"

type StockMutationFilter struct {
	ProductID     *int
	MutationType  string
	ReferenceType string
	DateFrom      string
	DateTo        string
	Page          int
	Limit         int
}

type StockMutationResponse struct {
	ID            int       `json:"id"`
	ProductID     int       `json:"product_id"`
	ProductName   string    `json:"product_name"`
	MutationType  string    `json:"mutation_type"`
	Quantity      float64   `json:"quantity"`
	StockBefore   float64   `json:"stock_before"`
	StockAfter    float64   `json:"stock_after"`
	ReferenceType string    `json:"reference_type"`
	ReferenceID   int       `json:"reference_id"`
	Notes         string    `json:"notes"`
	UserName      string    `json:"user_name"`
	CreatedAt     time.Time `json:"created_at"`
}

type StockMutationByProductResponse struct {
	ID            int       `json:"id"`
	MutationType  string    `json:"mutation_type"`
	Quantity      float64   `json:"quantity"`
	StockBefore   float64   `json:"stock_before"`
	StockAfter    float64   `json:"stock_after"`
	ReferenceType string    `json:"reference_type"`
	ReferenceID   int       `json:"reference_id"`
	Notes         string    `json:"notes"`
	UserName      string    `json:"user_name"`
	CreatedAt     time.Time `json:"created_at"`
}
