package model_sync

import "time"

type SyncHistory struct {
	ID            int64      `db:"id"`
	DeviceID      string     `db:"device_id"`
	DeviceType    string     `db:"device_type"`
	TotalItems    int        `db:"total_items"`
	SyncedItems   int        `db:"synced_items"`
	ConflictItems int        `db:"conflict_items"`
	FailedItems   int        `db:"failed_items"`
	DurationMs    int        `db:"duration_ms"`
	Status        string     `db:"status"`
	StartedAt     time.Time  `db:"started_at"`
	FinishedAt    *time.Time `db:"finished_at"`
}

type SyncConflict struct {
	ID             int        `json:"id"`
	EntityType     string     `json:"entity_type"`
	EntityID       int        `json:"entity_id"`
	LocalID        string     `json:"local_id"`
	DeviceID       string     `json:"device_id"`
	DesktopData    string     `json:"desktop_data"`
	OnlineData     string     `json:"online_data"`
	DesktopTime    time.Time  `json:"desktop_time"`
	OnlineTime     time.Time  `json:"online_time"`
	Status         string     `json:"status"`
	ResolvedBy     *int       `json:"resolved_by"`
	Resolution     *string    `json:"resolution"`
	ResolvedAction *string    `json:"resolved_action"`
	ResolvedAt     *time.Time `json:"resolved_at"`
}

// EntitySnapshot digunakan oleh DetectConflict untuk membandingkan timestamp
type EntitySnapshot struct {
	UpdatedAt string `json:"updated_at"`
	Data      string `json:"data"` // JSON snapshot dari entity
}

type SyncQueue struct {
	ID           int        `json:"id"`
	DeviceID     string     `json:"device_id"`
	EntityType   string     `json:"entity_type"`
	EntityID     int        `json:"entity_id"`
	Action       string     `json:"action"`
	Payload      string     `json:"payload"`
	Status       string     `json:"status"`
	RetryCount   int        `json:"retry_count"`
	ErrorMessage *string    `json:"error_message"`
	SyncedAt     *time.Time `json:"synced_at"`
	CreatedAt    time.Time  `json:"created_at"`
}
