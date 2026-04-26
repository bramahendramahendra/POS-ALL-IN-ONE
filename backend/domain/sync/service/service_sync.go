package service_sync

import (
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

func (s *syncService) PushSync(req *dto_sync.PushSyncRequest) (*dto_sync.PushSyncResponse, error) {
	processed, conflicts, failed := 0, 0, 0

	for i := range req.Items {
		item := &req.Items[i]

		queueID, err := s.repo.CreateQueueItem(req.DeviceID, item)
		if err != nil {
			failed++
			continue
		}

		if updateErr := s.repo.UpdateQueueStatus(queueID, "synced", ""); updateErr == nil {
			processed++
		} else {
			// Simpan sebagai konflik untuk direview Owner/Admin
			_ = s.repo.CreateConflict(item)
			_ = s.repo.UpdateQueueStatus(queueID, "failed", "conflict")
			conflicts++
		}
	}

	return &dto_sync.PushSyncResponse{
		Processed: processed,
		Conflicts: conflicts,
		Failed:    failed,
	}, nil
}

func (s *syncService) GetConflicts(filter *dto_sync.ConflictFilter) (*dto_sync.ConflictListResponse, error) {
	data, total, err := s.repo.GetConflicts(filter)
	if err != nil {
		return nil, &errors.InternalServerError{Message: "Gagal mengambil data konflik"}
	}
	return &dto_sync.ConflictListResponse{Data: data, Total: total}, nil
}

func (s *syncService) ResolveConflict(id, userID int, resolution string) error {
	conflict, err := s.repo.GetConflictByID(id)
	if err != nil {
		return &errors.NotFoundError{Message: "Konflik tidak ditemukan"}
	}

	if conflict.Status == "resolved" {
		return &errors.BadRequestError{Message: "Konflik sudah diselesaikan"}
	}

	// Jika "online" → tidak perlu apa-apa, data online sudah berlaku
	// Jika "desktop" → idealnya terapkan desktop_data ke entity terkait
	// Untuk saat ini cukup catat resolution-nya

	return s.repo.ResolveConflict(id, userID, resolution)
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
