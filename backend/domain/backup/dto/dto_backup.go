package dto_backup

import "time"

type BackupInfo struct {
	Filename  string    `json:"filename"`
	Size      string    `json:"size"`
	CreatedAt time.Time `json:"created_at"`
}

type BackupListResponse struct {
	Files []BackupInfo `json:"files"`
}
