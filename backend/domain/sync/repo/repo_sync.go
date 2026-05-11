package repo_sync

import (
	"encoding/json"
	"fmt"

	dto_sync "pos_api/domain/sync/dto"
	model_sync "pos_api/domain/sync/model"

	"gorm.io/gorm"
)

const (
	GetConflictsQuery    = `SELECT id, entity_type, entity_id, local_id, device_id, desktop_data, online_data, desktop_time, online_time, status, created_at FROM sync_conflicts WHERE 1=1`
	countConflictsBase   = `SELECT COUNT(*) FROM sync_conflicts WHERE 1=1`
	getConflictByIDQuery = `SELECT id, entity_type, entity_id, desktop_data, online_data, desktop_time, online_time, status, resolved_by, resolution, resolved_at FROM sync_conflicts WHERE id = ?`
	ResolveConflictQuery = `UPDATE sync_conflicts SET status='resolved', resolved_by=?, resolved_action=?, resolved_at=NOW() WHERE id=?`
	CreateConflictQuery  = `INSERT INTO sync_conflicts (entity_type, entity_id, local_id, device_id, desktop_data, online_data, desktop_time, online_time) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`

	GetQueueQuery          = `SELECT id, device_id, entity_type, entity_id, action, status, retry_count, created_at FROM sync_queue WHERE 1=1`
	countQueueBase         = `SELECT COUNT(*) FROM sync_queue WHERE 1=1`
	CreateQueueItemQuery   = `INSERT INTO sync_queue (device_id, entity_type, entity_id, action, payload, status) VALUES (?, ?, ?, ?, ?, 'pending')`
	UpdateQueueStatusQuery = `UPDATE sync_queue SET status=?, synced_at=CASE WHEN ? = 'synced' THEN NOW() ELSE NULL END, error_message=? WHERE id=?`

	insertHistoryQuery = `INSERT INTO sync_history (device_id, device_type, total_items, synced_items, conflict_items, failed_items, duration_ms, status, started_at, finished_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	getHistoryQuery    = `SELECT id, device_id, device_type, total_items, synced_items, conflict_items, failed_items, duration_ms, status, DATE_FORMAT(started_at,'%Y-%m-%dT%H:%i:%sZ'), DATE_FORMAT(finished_at,'%Y-%m-%dT%H:%i:%sZ') FROM sync_history WHERE 1=1`
	countHistoryBase   = `SELECT COUNT(*) FROM sync_history WHERE 1=1`

	// entityTableMap menentukan tabel dan kolom JSON per entity type
	// Format query: SELECT updated_at, JSON_OBJECT(...) AS data FROM <table> WHERE id=?
	// Tabel yang didukung: products, transactions, expenses
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
		if err := rows.Scan(
			&item.ID, &item.EntityType, &item.EntityID,
			&item.LocalID, &item.DeviceID,
			&item.DesktopData, &item.OnlineData,
			&item.DesktopTime, &item.OnlineTime,
			&item.Status, &item.CreatedAt,
		); err != nil {
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

func (r *syncRepo) CountPendingConflicts() (int, error) {
	var count int
	err := r.db.Raw(`SELECT COUNT(*) FROM sync_conflicts WHERE status = 'pending'`).Scan(&count).Error
	return count, err
}

func (r *syncRepo) ResolveConflict(id, userID int, action string) error {
	return r.db.Exec(ResolveConflictQuery, userID, action, id).Error
}

// MarkResolved menandai konflik resolved dengan audit trail; dipakai setelah entity berhasil diupdate.
func (r *syncRepo) MarkResolved(id, resolvedBy int, action string) error {
	return r.db.Exec(ResolveConflictQuery, resolvedBy, action, id).Error
}

// CreateConflict menyimpan konflik ke sync_conflicts dan mengembalikan ID konflik yang baru
func (r *syncRepo) CreateConflict(deviceID string, item *dto_sync.SyncItem, onlineData string) (int, error) {
	result := r.db.Exec(CreateConflictQuery,
		item.EntityType, item.ServerID, item.LocalID, deviceID,
		item.Payload, onlineData,
	)
	if result.Error != nil {
		return 0, result.Error
	}
	var id int
	r.db.Raw("SELECT LAST_INSERT_ID()").Scan(&id)
	return id, nil
}

// entityTable memetakan entity type ke nama tabel MySQL.
func entityTable(entityType string) string {
	switch entityType {
	case "product":
		return "products"
	case "transaction":
		return "transactions"
	case "expense":
		return "expenses"
	}
	return ""
}

// GetRawByEntityAndID mengambil seluruh kolom entity sebagai JSON string.
// Menggunakan map scan agar tidak perlu tahu kolom setiap tabel.
func (r *syncRepo) GetRawByEntityAndID(entityType string, serverID int) (string, error) {
	table := entityTable(entityType)
	if table == "" {
		return "{}", nil
	}

	query := fmt.Sprintf(`SELECT * FROM %s WHERE id = ? LIMIT 1`, table)
	rows, err := r.db.Raw(query, serverID).Rows()
	if err != nil {
		return "{}", err
	}
	defer rows.Close()

	if !rows.Next() {
		return "{}", nil
	}

	cols, err := rows.Columns()
	if err != nil {
		return "{}", err
	}

	values := make([]interface{}, len(cols))
	valuePtrs := make([]interface{}, len(cols))
	for i := range values {
		valuePtrs[i] = &values[i]
	}
	if err := rows.Scan(valuePtrs...); err != nil {
		return "{}", err
	}

	rowMap := make(map[string]interface{}, len(cols))
	for i, col := range cols {
		val := values[i]
		// []byte dari MySQL (mis. JSON/TEXT) dikonversi ke string
		if b, ok := val.([]byte); ok {
			rowMap[col] = string(b)
		} else {
			rowMap[col] = val
		}
	}

	b, err := json.Marshal(rowMap)
	if err != nil {
		return "{}", err
	}
	return string(b), nil
}

// GetEntitySnapshot mengambil updated_at dan full JSON snapshot entity dari tabel aslinya.
// updated_at dipakai DetectConflict; Data dipakai sebagai online_data di sync_conflicts.
func (r *syncRepo) GetEntitySnapshot(entityType string, serverID int) (*model_sync.EntitySnapshot, error) {
	table := entityTable(entityType)
	if table == "" {
		return nil, nil
	}

	query := fmt.Sprintf(
		`SELECT DATE_FORMAT(updated_at, '%%Y-%%m-%%dT%%H:%%i:%%sZ') FROM %s WHERE id = ? LIMIT 1`,
		table,
	)

	var updatedAt string
	row := r.db.Raw(query, serverID).Row()
	if err := row.Scan(&updatedAt); err != nil {
		// Row tidak ditemukan → entity belum ada di server, tidak ada konflik
		return nil, nil
	}

	rawJSON, _ := r.GetRawByEntityAndID(entityType, serverID)
	return &model_sync.EntitySnapshot{
		UpdatedAt: updatedAt,
		Data:      rawJSON,
	}, nil
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

func (r *syncRepo) InsertHistory(h model_sync.SyncHistory) error {
	return r.db.Exec(insertHistoryQuery,
		h.DeviceID, h.DeviceType, h.TotalItems, h.SyncedItems,
		h.ConflictItems, h.FailedItems, h.DurationMs, h.Status,
		h.StartedAt, h.FinishedAt,
	).Error
}

func (r *syncRepo) GetHistory(filter *dto_sync.HistoryFilter) ([]dto_sync.SyncHistoryResponse, int, error) {
	var args, countArgs []interface{}
	conditions := ""

	if filter.DeviceID != "" {
		conditions += " AND device_id = ?"
		args = append(args, filter.DeviceID)
		countArgs = append(countArgs, filter.DeviceID)
	}
	if filter.StartDate != "" {
		conditions += " AND DATE(started_at) >= ?"
		args = append(args, filter.StartDate)
		countArgs = append(countArgs, filter.StartDate)
	}
	if filter.EndDate != "" {
		conditions += " AND DATE(started_at) <= ?"
		args = append(args, filter.EndDate)
		countArgs = append(countArgs, filter.EndDate)
	}

	var total int
	if err := r.db.Raw(countHistoryBase+conditions, countArgs...).Scan(&total).Error; err != nil {
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

	query := getHistoryQuery + conditions + fmt.Sprintf(" ORDER BY started_at DESC LIMIT %d OFFSET %d", limit, offset)

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []dto_sync.SyncHistoryResponse
	for rows.Next() {
		var item dto_sync.SyncHistoryResponse
		if err := rows.Scan(
			&item.ID, &item.DeviceID, &item.DeviceType,
			&item.TotalItems, &item.SyncedItems, &item.ConflictItems,
			&item.FailedItems, &item.DurationMs, &item.Status,
			&item.StartedAt, &item.FinishedAt,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}
	if items == nil {
		items = []dto_sync.SyncHistoryResponse{}
	}
	return items, total, nil
}
