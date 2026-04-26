package dto_sync

import "time"

// --- Push Sync ---

type SyncItem struct {
	EntityType  string `json:"entity_type"`
	EntityID    int    `json:"entity_id"`
	Action      string `json:"action"` // create, update, delete
	Payload     string `json:"payload"`
	DesktopTime string `json:"desktop_time"`
}

type PushSyncRequest struct {
	DeviceID string     `json:"device_id" binding:"required"`
	Items    []SyncItem `json:"items" binding:"required"`
}

type PushSyncResponse struct {
	Processed int `json:"processed"`
	Conflicts int `json:"conflicts"`
	Failed    int `json:"failed"`
}

// --- Conflicts ---

type ConflictFilter struct {
	Status string
	Page   int
	Limit  int
}

type ConflictResponse struct {
	ID          int        `json:"id"`
	EntityType  string     `json:"entity_type"`
	EntityID    int        `json:"entity_id"`
	DesktopData string     `json:"desktop_data"`
	OnlineData  string     `json:"online_data"`
	DesktopTime time.Time  `json:"desktop_time"`
	OnlineTime  time.Time  `json:"online_time"`
	Status      string     `json:"status"`
}

type ConflictListResponse struct {
	Data  []ConflictResponse `json:"data"`
	Total int                `json:"total"`
}

type ResolveConflictRequest struct {
	Resolution string `json:"resolution" binding:"required,oneof=desktop online"`
}

// --- Queue ---

type QueueFilter struct {
	DeviceID   string
	Status     string
	EntityType string
	Page       int
	Limit      int
}

type QueueResponse struct {
	ID         int       `json:"id"`
	DeviceID   string    `json:"device_id"`
	EntityType string    `json:"entity_type"`
	EntityID   int       `json:"entity_id"`
	Action     string    `json:"action"`
	Status     string    `json:"status"`
	RetryCount int       `json:"retry_count"`
	CreatedAt  time.Time `json:"created_at"`
}

type QueueListResponse struct {
	Data  []QueueResponse `json:"data"`
	Total int             `json:"total"`
}

// --- History ---

type HistoryFilter struct {
	DeviceID   string
	EntityType string
	DateFrom   string
	DateTo     string
	Page       int
	Limit      int
}
