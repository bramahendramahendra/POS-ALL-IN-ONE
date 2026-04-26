package dto_master

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
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}
