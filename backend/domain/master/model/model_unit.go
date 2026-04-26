package model_master

import "time"

type Unit struct {
	ID           int       `db:"id"`
	Name         string    `db:"name"`
	Abbreviation string    `db:"abbreviation"`
	IsActive     bool      `db:"is_active"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}
