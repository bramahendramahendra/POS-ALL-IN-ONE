package repo_sync

import (
	"fmt"

	dto_sync "permen_api/domain/sync/dto"
	model_sync "permen_api/domain/sync/model"

	"gorm.io/gorm"
)

const (
	GetConflictsQuery    = `SELECT id, entity_type, entity_id, desktop_data, online_data, desktop_time, online_time, status FROM sync_conflicts WHERE 1=1`
	countConflictsBase   = `SELECT COUNT(*) FROM sync_conflicts WHERE 1=1`
	getConflictByIDQuery = `SELECT id, entity_type, entity_id, desktop_data, online_data, desktop_time, online_time, status, resolved_by, resolution, resolved_at FROM sync_conflicts WHERE id = ?`
	ResolveConflictQuery = `UPDATE sync_conflicts SET status='resolved', resolved_by=?, resolution=?, resolved_at=NOW() WHERE id=?`
	CreateConflictQuery  = `INSERT INTO sync_conflicts (entity_type, entity_id, desktop_data, online_data, desktop_time, online_time) VALUES (?, ?, ?, ?, ?, ?)`

	GetQueueQuery        = `SELECT id, device_id, entity_type, entity_id, action, status, retry_count, created_at FROM sync_queue WHERE 1=1`
	countQueueBase       = `SELECT COUNT(*) FROM sync_queue WHERE 1=1`
	CreateQueueItemQuery = `INSERT INTO sync_queue (device_id, entity_type, entity_id, action, payload, status) VALUES (?, ?, ?, ?, ?, 'pending')`
	UpdateQueueStatusQuery = `UPDATE sync_queue SET status=?, synced_at=CASE WHEN ? = 'synced' THEN NOW() ELSE NULL END, error_message=? WHERE id=?`
)

type syncRepo struct {
	db *gorm.DB
}

func NewSyncRepo(db *gorm.DB) SyncRepo {
	return &syncRepo{db: db}
}

func (r *syncRepo) GetConflicts(filter *dto_sync.ConflictFilter) ([]dto_sync.ConflictResponse, int, error) {
	var args, countArgs []interface{}
	conditions := ""

	if filter.Status != "" {
		conditions += " AND status = ?"
		args = append(args, filter.Status)
		countArgs = append(countArgs, filter.Status)
	}

	var total int
	if err := r.db.Raw(countConflictsBase+conditions, countArgs...).Scan(&total).Error; err != nil {
		return nil, 0, err
	}

	page, limit := filter.Page, filter.Limit
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := GetConflictsQuery + conditions + fmt.Sprintf(" ORDER BY id DESC LIMIT %d OFFSET %d", limit, offset)

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []dto_sync.ConflictResponse
	for rows.Next() {
		var item dto_sync.ConflictResponse
		if err := rows.Scan(&item.ID, &item.EntityType, &item.EntityID, &item.DesktopData, &item.OnlineData, &item.DesktopTime, &item.OnlineTime, &item.Status); err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}
	if items == nil {
		items = []dto_sync.ConflictResponse{}
	}
	return items, total, nil
}

func (r *syncRepo) GetConflictByID(id int) (*model_sync.SyncConflict, error) {
	row := r.db.Raw(getConflictByIDQuery, id).Row()
	var c model_sync.SyncConflict
	if err := row.Scan(&c.ID, &c.EntityType, &c.EntityID, &c.DesktopData, &c.OnlineData, &c.DesktopTime, &c.OnlineTime, &c.Status, &c.ResolvedBy, &c.Resolution, &c.ResolvedAt); err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *syncRepo) ResolveConflict(id, userID int, resolution string) error {
	return r.db.Exec(ResolveConflictQuery, userID, resolution, id).Error
}

func (r *syncRepo) CreateConflict(item *dto_sync.SyncItem) error {
	return r.db.Exec(CreateConflictQuery, item.EntityType, item.EntityID, item.Payload, "", item.DesktopTime, item.DesktopTime).Error
}

func (r *syncRepo) GetQueue(filter *dto_sync.QueueFilter) ([]dto_sync.QueueResponse, int, error) {
	var args, countArgs []interface{}
	conditions := ""

	if filter.DeviceID != "" {
		conditions += " AND device_id = ?"
		args = append(args, filter.DeviceID)
		countArgs = append(countArgs, filter.DeviceID)
	}
	if filter.Status != "" {
		conditions += " AND status = ?"
		args = append(args, filter.Status)
		countArgs = append(countArgs, filter.Status)
	}
	if filter.EntityType != "" {
		conditions += " AND entity_type = ?"
		args = append(args, filter.EntityType)
		countArgs = append(countArgs, filter.EntityType)
	}

	var total int
	if err := r.db.Raw(countQueueBase+conditions, countArgs...).Scan(&total).Error; err != nil {
		return nil, 0, err
	}

	page, limit := filter.Page, filter.Limit
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := GetQueueQuery + conditions + fmt.Sprintf(" ORDER BY created_at DESC LIMIT %d OFFSET %d", limit, offset)

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []dto_sync.QueueResponse
	for rows.Next() {
		var item dto_sync.QueueResponse
		if err := rows.Scan(&item.ID, &item.DeviceID, &item.EntityType, &item.EntityID, &item.Action, &item.Status, &item.RetryCount, &item.CreatedAt); err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}
	if items == nil {
		items = []dto_sync.QueueResponse{}
	}
	return items, total, nil
}

func (r *syncRepo) CreateQueueItem(deviceID string, item *dto_sync.SyncItem) (int, error) {
	result := r.db.Exec(CreateQueueItemQuery, deviceID, item.EntityType, item.EntityID, item.Action, item.Payload)
	if result.Error != nil {
		return 0, result.Error
	}
	var id int
	r.db.Raw("SELECT LAST_INSERT_ID()").Scan(&id)
	return id, nil
}

func (r *syncRepo) UpdateQueueStatus(id int, status, errMsg string) error {
	return r.db.Exec(UpdateQueueStatusQuery, status, status, errMsg, id).Error
}

func (r *syncRepo) GetHistory(filter *dto_sync.HistoryFilter) ([]dto_sync.QueueResponse, int, error) {
	var args, countArgs []interface{}
	conditions := " AND status = 'synced'"

	if filter.DeviceID != "" {
		conditions += " AND device_id = ?"
		args = append(args, filter.DeviceID)
		countArgs = append(countArgs, filter.DeviceID)
	}
	if filter.EntityType != "" {
		conditions += " AND entity_type = ?"
		args = append(args, filter.EntityType)
		countArgs = append(countArgs, filter.EntityType)
	}
	if filter.DateFrom != "" {
		conditions += " AND DATE(created_at) >= ?"
		args = append(args, filter.DateFrom)
		countArgs = append(countArgs, filter.DateFrom)
	}
	if filter.DateTo != "" {
		conditions += " AND DATE(created_at) <= ?"
		args = append(args, filter.DateTo)
		countArgs = append(countArgs, filter.DateTo)
	}

	var total int
	if err := r.db.Raw(countQueueBase+conditions, countArgs...).Scan(&total).Error; err != nil {
		return nil, 0, err
	}

	page, limit := filter.Page, filter.Limit
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := GetQueueQuery + conditions + fmt.Sprintf(" ORDER BY created_at DESC LIMIT %d OFFSET %d", limit, offset)

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []dto_sync.QueueResponse
	for rows.Next() {
		var item dto_sync.QueueResponse
		if err := rows.Scan(&item.ID, &item.DeviceID, &item.EntityType, &item.EntityID, &item.Action, &item.Status, &item.RetryCount, &item.CreatedAt); err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}
	if items == nil {
		items = []dto_sync.QueueResponse{}
	}
	return items, total, nil
}
