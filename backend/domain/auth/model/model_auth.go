package model_auth

import "time"

type User struct {
	ID        int       `db:"id"`
	Username  string    `db:"username"`
	Password  string    `db:"password"`
	FullName  string    `db:"full_name"`
	Role      string    `db:"role"`
	IsActive  bool      `db:"is_active"`
	CreatedAt time.Time `db:"created_at"`
}

type Session struct {
	ID           int       `db:"id"`
	UserID       int       `db:"user_id"`
	Token        string    `db:"token"`
	RefreshToken string    `db:"refresh_token"`
	DeviceInfo   string    `db:"device_info"`
	IPAddress    string    `db:"ip_address"`
	CreatedAt    time.Time `db:"created_at"`
	ExpiresAt    time.Time `db:"expires_at"`
}
