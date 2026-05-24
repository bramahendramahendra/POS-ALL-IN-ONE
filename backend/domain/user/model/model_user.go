package model_user

import "time"

type User struct {
	ID        int       `db:"id"`
	Username  string    `db:"username"`
	Password  string    `db:"password"`
	FullName  string    `db:"full_name"`
	RoleID    int       `db:"role_id"`
	RoleName  string    `db:"role_name"` // dari JOIN roles.name
	IsActive  bool      `db:"is_active"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
}
