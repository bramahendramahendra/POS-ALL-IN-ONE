package model_sync

import "time"

type SyncConflict struct {
	ID          int        `json:"id"`
	EntityType  string     `json:"entity_type"`
	EntityID    int        `json:"entity_id"`
	DesktopData string     `json:"desktop_data"`
	OnlineData  string     `json:"online_data"`
	DesktopTime time.Time  `json:"desktop_time"`
	OnlineTime  time.Time  `json:"online_time"`
	Status      string     `json:"status"`
	ResolvedBy  *int       `json:"resolved_by"`
	Resolution  *string    `json:"resolution"`
	ResolvedAt  *time.Time `json:"resolved_at"`
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
