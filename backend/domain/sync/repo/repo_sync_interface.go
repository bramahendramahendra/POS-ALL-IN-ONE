package repo_sync

import (
	dto_sync "pos_api/domain/sync/dto"
	model_sync "pos_api/domain/sync/model"
)

type SyncRepo interface {
	// GetEntitySnapshot mengambil snapshot entity dari tabel aslinya (products/transactions/expenses)
	// Digunakan DetectConflict untuk membandingkan updated_at online vs desktop
	GetEntitySnapshot(entityType string, serverID int) (*model_sync.EntitySnapshot, error)

	// GetRawByEntityAndID mengambil seluruh kolom entity sebagai JSON string.
	// Digunakan sebagai online_data saat menyimpan konflik ke sync_conflicts.
	GetRawByEntityAndID(entityType string, serverID int) (string, error)

	GetConflicts(filter *dto_sync.ConflictFilter) ([]dto_sync.ConflictResponse, int, error)
	GetConflictByID(id int) (*model_sync.SyncConflict, error)
	CountPendingConflicts() (int, error)
	ResolveConflict(id, userID int, action string) error
	// MarkResolved menandai konflik sebagai resolved dengan audit trail (who + when + action)
	MarkResolved(id, resolvedBy int, action string) error
	CreateConflict(deviceID string, item *dto_sync.SyncItem, onlineData string) (int, error)

	GetQueue(filter *dto_sync.QueueFilter) ([]dto_sync.QueueResponse, int, error)
	CreateQueueItem(deviceID string, item *dto_sync.SyncItem) (int, error)
	UpdateQueueStatus(id int, status, errMsg string) error

	// InsertHistory mencatat satu sesi push sync ke tabel sync_history
	InsertHistory(h model_sync.SyncHistory) error
	// GetHistory mengambil riwayat sesi sync dari tabel sync_history
	GetHistory(filter *dto_sync.HistoryFilter) ([]dto_sync.SyncHistoryResponse, int, error)
}
