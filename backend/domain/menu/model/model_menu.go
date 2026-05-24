package model_menu

import "time"

type Menu struct {
	ID         int        `db:"id"`
	ParentID   *int       `db:"parent_id"`
	KeyName    string     `db:"key_name"`
	Label      string     `db:"label"`
	Icon       *string    `db:"icon"`
	Path       *string    `db:"path"`
	OrderIndex int        `db:"order_index"`
	IsActive   bool       `db:"is_active"`
	CreatedAt  time.Time  `db:"created_at"`
	UpdatedAt  *time.Time `db:"updated_at"`
}
