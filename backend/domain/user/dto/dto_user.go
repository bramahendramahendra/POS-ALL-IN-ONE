package dto_user

import "time"

type CreateUserRequest struct {
	Username string `json:"username" validate:"required,min=3,alphanum"`
	Password string `json:"password" validate:"required,min=6"`
	FullName string `json:"full_name" validate:"required"`
	Role     string `json:"role" validate:"required,oneof=owner admin kasir"`
}

type UpdateUserRequest struct {
	FullName string `json:"full_name" validate:"required"`
	Role     string `json:"role" validate:"required,oneof=owner admin kasir"`
	Password string `json:"password" validate:"omitempty,min=6"`
}

type UserResponse struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	FullName  string    `json:"full_name"`
	Role      string    `json:"role"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}

type UserListFilter struct {
	Search   string
	Role     string
	IsActive *bool
}
