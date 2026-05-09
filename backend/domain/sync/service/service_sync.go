package service_sync

import (
	"time"

	dto_sync "permen_api/domain/sync/dto"
	repo_sync "permen_api/domain/sync/repo"
	"permen_api/errors"
)

type syncService struct {
	repo repo_sync.SyncRepo
}

func NewSyncService(repo repo_sync.SyncRepo) SyncService {
	return &syncService{repo: repo}
}

// detectConflict membandingkan timestamp online vs desktop.
// Mengembalikan (isConflict bool, onlineDataJSON string, error).
// Konflik terjadi bila data online sudah diubah setelah data desktop terakhir sync.
func (s *syncService) detectConflict(item *dto_sync.SyncItem) (bool, string, error) {
	// Item baru (ServerID == 0) berarti belum ada di server → tidak mungkin konflik
	if item.ServerID == 0 {
		return false, "", nil
	}

	snapshot, err := s.repo.GetEntitySnapshot(item.EntityType, item.ServerID)
	if err != nil || snapshot == nil {
		return false, "", nil // data tidak ada di server → langsung apply
	}

	onlineTime, err := time.Parse(time.RFC3339, snapshot.UpdatedAt)
	if err != nil {
		return false, "", nil
	}

	desktopTime, err := time.Parse(time.RFC3339, item.UpdatedAt)
	if err != nil {
		return false, "", nil
	}

	// Konflik: data online lebih baru daripada data yang diketahui desktop
	if onlineTime.After(desktopTime) {
		return true, snapshot.Data, nil
	}

	return false, "", nil
}

func (s *syncService) PushSync(req *dto_sync.PushSyncRequest) (*dto_sync.PushSyncResponse, error) {
	processed, conflicts, failed := 0, 0, 0
	results := make([]dto_sync.SyncItemResult, 0, len(req.Items))

	for i := range req.Items {
		item := &req.Items[i]

		isConflict, onlineData, _ := s.detectConflict(item)
		if isConflict {
			// Simpan ke sync_conflicts; jangan apply ke MySQL dulu
			conflictID, err := s.repo.CreateConflict(req.DeviceID, item, onlineData)
			if err != nil {
				failed++
				results = append(results, dto_sync.SyncItemResult{
					LocalID: item.LocalID,
					Status:  "failed",
				})
				continue
			}
			conflicts++
			results = append(results, dto_sync.SyncItemResult{
				LocalID:    item.LocalID,
				Status:     "conflict",
				ConflictID: conflictID,
			})
			continue
		}

		// Tidak ada konflik → apply langsung via queue
		queueID, err := s.repo.CreateQueueItem(req.DeviceID, item)
		if err != nil {
			failed++
			results = append(results, dto_sync.SyncItemResult{
				LocalID: item.LocalID,
				Status:  "failed",
			})
			continue
		}

		_ = s.repo.UpdateQueueStatus(queueID, "synced", "")
		processed++
		results = append(results, dto_sync.SyncItemResult{
			LocalID:  item.LocalID,
			Status:   "synced",
			ServerID: item.ServerID,
		})
	}

	return &dto_sync.PushSyncResponse{
		Processed: processed,
		Conflicts: conflicts,
		Failed:    failed,
		Results:   results,
	}, nil
}

func (s *syncService) GetConflicts(filter *dto_sync.ConflictFilter) (*dto_sync.ConflictListResponse, error) {
	data, total, err := s.repo.GetConflicts(filter)
	if err != nil {
		return nil, &errors.InternalServerError{Message: "Gagal mengambil data konflik"}
	}
	page, limit := filter.Page, filter.Limit
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	return &dto_sync.ConflictListResponse{
		Data:  data,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

func (s *syncService) ResolveConflict(id, userID int, action string) error {
	conflict, err := s.repo.GetConflictByID(id)
	if err != nil {
		return &errors.NotFoundError{Message: "Konflik tidak ditemukan"}
	}

	if conflict.Status == "resolved" {
		return &errors.BadRequestError{Message: "Konflik sudah diselesaikan"}
	}

	// approve → terapkan desktop_data ke MySQL (fase 6.2)
	// reject  → pertahankan versi online, catat saja action-nya
	return s.repo.ResolveConflict(id, userID, action)
}

func (s *syncService) GetQueue(filter *dto_sync.QueueFilter) (*dto_sync.QueueListResponse, error) {
	data, total, err := s.repo.GetQueue(filter)
	if err != nil {
		return nil, &errors.InternalServerError{Message: "Gagal mengambil data antrian sync"}
	}
	return &dto_sync.QueueListResponse{Data: data, Total: total}, nil
}

func (s *syncService) GetHistory(filter *dto_sync.HistoryFilter) (*dto_sync.QueueListResponse, error) {
	data, total, err := s.repo.GetHistory(filter)
	if err != nil {
		return nil, &errors.InternalServerError{Message: "Gagal mengambil riwayat sync"}
	}
	return &dto_sync.QueueListResponse{Data: data, Total: total}, nil
}
