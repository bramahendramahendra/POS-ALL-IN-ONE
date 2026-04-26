package repo_shift

import (
	dto_shift "permen_api/domain/shift/dto"

	"gorm.io/gorm"
)

const (
	getAllShiftsQuery      = `SELECT id, name, start_time, end_time, is_active FROM shifts ORDER BY start_time`
	getActiveShiftsQuery   = `SELECT id, name, start_time, end_time FROM shifts WHERE is_active = 1 ORDER BY start_time`
	getShiftByIDQuery      = `SELECT id, name, start_time, end_time, is_active FROM shifts WHERE id = ?`
	checkShiftUsedQuery    = `SELECT COUNT(*) FROM cash_drawer WHERE shift_id = ? AND status = 'open'`
	createShiftQuery       = `INSERT INTO shifts (name, start_time, end_time) VALUES (?, ?, ?)`
	updateShiftQuery       = `UPDATE shifts SET name=?, start_time=?, end_time=?, updated_at=NOW() WHERE id=?`
	deleteShiftQuery       = `DELETE FROM shifts WHERE id = ?`
	toggleShiftStatusQuery = `UPDATE shifts SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?`
	getShiftSummaryQuery   = `SELECT cd.shift_id, s.name as shift_name, COUNT(t.id) as total_transactions, SUM(t.total_amount) as total_sales, SUM(CASE WHEN t.payment_method='cash' THEN t.total_amount ELSE 0 END) as total_cash, SUM(CASE WHEN t.payment_method!='cash' THEN t.total_amount ELSE 0 END) as total_non_cash FROM cash_drawer cd LEFT JOIN shifts s ON cd.shift_id = s.id LEFT JOIN transactions t ON DATE(t.transaction_date) = DATE(cd.open_time) WHERE 1=1 GROUP BY cd.shift_id, s.name`
)

type shiftRepo struct {
	db *gorm.DB
}

func NewShiftRepo(db *gorm.DB) ShiftRepo {
	return &shiftRepo{db: db}
}

func (r *shiftRepo) GetAll() ([]*dto_shift.ShiftResponse, error) {
	rows, err := r.db.Raw(getAllShiftsQuery).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*dto_shift.ShiftResponse
	for rows.Next() {
		var item dto_shift.ShiftResponse
		if err := rows.Scan(&item.ID, &item.Name, &item.StartTime, &item.EndTime, &item.IsActive); err != nil {
			return nil, err
		}
		items = append(items, &item)
	}
	if items == nil {
		items = []*dto_shift.ShiftResponse{}
	}
	return items, nil
}

func (r *shiftRepo) GetActive() ([]*dto_shift.ShiftActiveResponse, error) {
	rows, err := r.db.Raw(getActiveShiftsQuery).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*dto_shift.ShiftActiveResponse
	for rows.Next() {
		var item dto_shift.ShiftActiveResponse
		if err := rows.Scan(&item.ID, &item.Name, &item.StartTime, &item.EndTime); err != nil {
			return nil, err
		}
		items = append(items, &item)
	}
	if items == nil {
		items = []*dto_shift.ShiftActiveResponse{}
	}
	return items, nil
}

func (r *shiftRepo) GetByID(id int) (*dto_shift.ShiftResponse, error) {
	rows, err := r.db.Raw(getShiftByIDQuery, id).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if rows.Next() {
		var item dto_shift.ShiftResponse
		if err := rows.Scan(&item.ID, &item.Name, &item.StartTime, &item.EndTime, &item.IsActive); err != nil {
			return nil, err
		}
		return &item, nil
	}
	return nil, nil
}

func (r *shiftRepo) CountOpenCashDrawer(shiftID int) (int, error) {
	var count int
	if err := r.db.Raw(checkShiftUsedQuery, shiftID).Scan(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *shiftRepo) Create(req *dto_shift.ShiftRequest) (int, error) {
	if err := r.db.Exec(createShiftQuery, req.Name, req.StartTime, req.EndTime).Error; err != nil {
		return 0, err
	}
	var id int
	if err := r.db.Raw(`SELECT LAST_INSERT_ID()`).Scan(&id).Error; err != nil {
		return 0, err
	}
	return id, nil
}

func (r *shiftRepo) Update(id int, req *dto_shift.ShiftRequest) error {
	return r.db.Exec(updateShiftQuery, req.Name, req.StartTime, req.EndTime, id).Error
}

func (r *shiftRepo) Delete(id int) error {
	return r.db.Exec(deleteShiftQuery, id).Error
}

func (r *shiftRepo) ToggleStatus(id int) error {
	return r.db.Exec(toggleShiftStatusQuery, id).Error
}

func (r *shiftRepo) GetSummary() ([]*dto_shift.ShiftSummaryResponse, error) {
	rows, err := r.db.Raw(getShiftSummaryQuery).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*dto_shift.ShiftSummaryResponse
	for rows.Next() {
		var item dto_shift.ShiftSummaryResponse
		if err := rows.Scan(
			&item.ShiftID, &item.ShiftName,
			&item.TotalTransactions, &item.TotalSales,
			&item.TotalCash, &item.TotalNonCash,
		); err != nil {
			return nil, err
		}
		items = append(items, &item)
	}
	if items == nil {
		items = []*dto_shift.ShiftSummaryResponse{}
	}
	return items, nil
}
