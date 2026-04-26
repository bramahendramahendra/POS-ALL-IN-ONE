package model_shift

import "time"

type Shift struct {
	ID        int        `db:"id"`
	Name      string     `db:"name"`
	StartTime string     `db:"start_time"`
	EndTime   string     `db:"end_time"`
	IsActive  bool       `db:"is_active"`
	CreatedAt time.Time  `db:"created_at"`
	UpdatedAt *time.Time `db:"updated_at"`
}
