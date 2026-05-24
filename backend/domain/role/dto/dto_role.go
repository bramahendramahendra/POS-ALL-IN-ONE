package dto_role

import "time"

type CreateRoleRequest struct {
	Name        string `json:"name"         validate:"required,min=2,alphanum"`
	DisplayName string `json:"display_name" validate:"required"`
	Description string `json:"description"`
}

type UpdateRoleRequest struct {
	DisplayName string `json:"display_name" validate:"required"`
	Description string `json:"description"`
}

type RoleResponse struct {
	ID          int        `json:"id"`
	Name        string     `json:"name"`
	DisplayName string     `json:"display_name"`
	Description *string    `json:"description"`
	IsSystem    bool       `json:"is_system"`
	IsActive    bool       `json:"is_active"`
	CreatedAt   time.Time  `json:"created_at"`
}

type RoleListFilter struct {
	Search   string
	IsActive *bool
}
