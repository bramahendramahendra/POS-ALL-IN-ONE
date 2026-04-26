package service_sync

import dto_sync "permen_api/domain/sync/dto"

type SyncService interface {
	PushSync(req *dto_sync.PushSyncRequest) (*dto_sync.PushSyncResponse, error)
	GetConflicts(filter *dto_sync.ConflictFilter) (*dto_sync.ConflictListResponse, error)
	ResolveConflict(id, userID int, resolution string) error
	GetQueue(filter *dto_sync.QueueFilter) (*dto_sync.QueueListResponse, error)
	GetHistory(filter *dto_sync.HistoryFilter) (*dto_sync.QueueListResponse, error)
}
