package repo_sync

import (
	dto_sync "permen_api/domain/sync/dto"
	model_sync "permen_api/domain/sync/model"
)

type SyncRepo interface {
	GetConflicts(filter *dto_sync.ConflictFilter) ([]dto_sync.ConflictResponse, int, error)
	GetConflictByID(id int) (*model_sync.SyncConflict, error)
	ResolveConflict(id, userID int, resolution string) error
	CreateConflict(item *dto_sync.SyncItem) error

	GetQueue(filter *dto_sync.QueueFilter) ([]dto_sync.QueueResponse, int, error)
	CreateQueueItem(deviceID string, item *dto_sync.SyncItem) (int, error)
	UpdateQueueStatus(id int, status, errMsg string) error

	GetHistory(filter *dto_sync.HistoryFilter) ([]dto_sync.QueueResponse, int, error)
}
