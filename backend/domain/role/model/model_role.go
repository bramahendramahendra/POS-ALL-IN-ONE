package model_role

import "time"

type Role struct {
	ID          int        `db:"id"`
	Name        string     `db:"name"`
	DisplayName string     `db:"display_name"`
	Description *string    `db:"description"`
	IsSystem    bool       `db:"is_system"`
	IsActive    bool       `db:"is_active"`
	CreatedAt   time.Time  `db:"created_at"`
	UpdatedAt   *time.Time `db:"updated_at"`
}
