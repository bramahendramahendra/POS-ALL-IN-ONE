package dto_product_category

import "time"

type CreateCategoryRequest struct {
	Name        string `json:"name" validate:"required,min=2"`
	Description string `json:"description"`
}

type UpdateCategoryRequest struct {
	Name        string `json:"name" validate:"required,min=2"`
	Description string `json:"description"`
}

type CategoryResponse struct {
	ID                 int       `json:"id"`
	Name               string    `json:"name"`
	Code               string    `json:"code"`
	Description        string    `json:"description"`
	IsActive           bool      `json:"is_active"`
	ProductCount       int       `json:"product_count"`
	ActiveProductCount int       `json:"active_product_count"`
	CreatedAt          time.Time `json:"created_at"`
}
