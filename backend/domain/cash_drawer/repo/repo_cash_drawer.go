package repo_cash_drawer

import (
	"fmt"

	dto_cash_drawer "permen_api/domain/cash_drawer/dto"
	model_cash_drawer "permen_api/domain/cash_drawer/model"

	"gorm.io/gorm"
)

const (
	getCurrentCashDrawerQuery = `SELECT cd.id, cd.user_id, u.full_name as user_name, cd.shift_id, s.name as shift_name, cd.open_time, cd.opening_balance, cd.total_sales, cd.total_cash_sales, cd.total_expenses, cd.expected_balance, cd.status FROM cash_drawer cd LEFT JOIN users u ON cd.user_id = u.id LEFT JOIN shifts s ON cd.shift_id = s.id WHERE cd.user_id = ? AND cd.status = 'open' LIMIT 1`
	getOpenCashDrawerQuery    = `SELECT id, user_id, shift_id, open_time, opening_balance, total_sales, total_cash_sales, total_expenses, expected_balance, status FROM cash_drawer WHERE user_id = ? AND status = 'open' LIMIT 1`
	getCashDrawerByIDQuery    = `SELECT id, user_id, shift_id, open_time, opening_balance, total_sales, total_cash_sales, total_expenses, expected_balance, status FROM cash_drawer WHERE id = ? LIMIT 1`
	openCashDrawerQuery       = `INSERT INTO cash_drawer (user_id, shift_id, open_time, opening_balance, status) VALUES (?, ?, NOW(), ?, 'open')`
	closeCashDrawerQuery      = `UPDATE cash_drawer SET close_time = NOW(), closing_balance = ?, expected_balance = ?, difference = ?, status = 'closed', notes = ?, updated_at = NOW() WHERE id = ?`
	updateSalesQuery          = `UPDATE cash_drawer SET total_sales = ?, total_cash_sales = ?, expected_balance = opening_balance + total_cash_sales - total_expenses, updated_at = NOW() WHERE id = ?`
	updateExpensesQuery       = `UPDATE cash_drawer SET total_expenses = total_expenses + ?, expected_balance = opening_balance + total_cash_sales - total_expenses, updated_at = NOW() WHERE id = ?`
	getCashDrawerHistoryBase  = `SELECT cd.id, u.full_name as user_name, s.name as shift_name, cd.open_time, cd.close_time, cd.opening_balance, cd.closing_balance, cd.expected_balance, cd.difference, cd.total_sales, cd.status FROM cash_drawer cd LEFT JOIN users u ON cd.user_id = u.id LEFT JOIN shifts s ON cd.shift_id = s.id WHERE 1=1`
	countCashDrawerHistoryBase = `SELECT COUNT(*) FROM cash_drawer cd WHERE 1=1`
)

type cashDrawerRepo struct {
	db *gorm.DB
}

func NewCashDrawerRepo(db *gorm.DB) CashDrawerRepo {
	return &cashDrawerRepo{db: db}
}

func (r *cashDrawerRepo) GetCurrent(userID int) (*dto_cash_drawer.CurrentCashDrawerResponse, error) {
	var res dto_cash_drawer.CurrentCashDrawerResponse
	result := r.db.Raw(getCurrentCashDrawerQuery, userID).Scan(&res)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &res, nil
}

func (r *cashDrawerRepo) GetOpenCashDrawer(userID int) (*model_cash_drawer.CashDrawer, error) {
	var cd model_cash_drawer.CashDrawer
	result := r.db.Raw(getOpenCashDrawerQuery, userID).Scan(&cd)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &cd, nil
}

func (r *cashDrawerRepo) GetByID(id int) (*model_cash_drawer.CashDrawer, error) {
	var cd model_cash_drawer.CashDrawer
	result := r.db.Raw(getCashDrawerByIDQuery, id).Scan(&cd)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &cd, nil
}

func (r *cashDrawerRepo) GetHistory(filter *dto_cash_drawer.CashDrawerFilter) ([]*dto_cash_drawer.CashDrawerHistoryResponse, int, error) {
	var args, countArgs []interface{}
	conditions := ""

	if filter.StartDate != "" {
		conditions += " AND DATE(cd.open_time) >= ?"
		args = append(args, filter.StartDate)
		countArgs = append(countArgs, filter.StartDate)
	}
	if filter.EndDate != "" {
		conditions += " AND DATE(cd.open_time) <= ?"
		args = append(args, filter.EndDate)
		countArgs = append(countArgs, filter.EndDate)
	}
	if filter.UserID != nil {
		conditions += " AND cd.user_id = ?"
		args = append(args, *filter.UserID)
		countArgs = append(countArgs, *filter.UserID)
	}
	if filter.Status != "" {
		conditions += " AND cd.status = ?"
		args = append(args, filter.Status)
		countArgs = append(countArgs, filter.Status)
	}

	var total int
	if err := r.db.Raw(countCashDrawerHistoryBase+conditions, countArgs...).Scan(&total).Error; err != nil {
		return nil, 0, err
	}

	page := filter.Page
	limit := filter.Limit
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := getCashDrawerHistoryBase + conditions + fmt.Sprintf(" ORDER BY cd.open_time DESC LIMIT %d OFFSET %d", limit, offset)

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []*dto_cash_drawer.CashDrawerHistoryResponse
	for rows.Next() {
		var item dto_cash_drawer.CashDrawerHistoryResponse
		if err := rows.Scan(
			&item.ID, &item.UserName, &item.ShiftName, &item.OpenTime, &item.CloseTime,
			&item.OpeningBalance, &item.ClosingBalance, &item.ExpectedBalance,
			&item.Difference, &item.TotalSales, &item.Status,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, &item)
	}
	if items == nil {
		items = []*dto_cash_drawer.CashDrawerHistoryResponse{}
	}
	return items, total, nil
}

func (r *cashDrawerRepo) Open(userID int, shiftID *int, openingBalance float64) (int, error) {
	if err := r.db.Exec(openCashDrawerQuery, userID, shiftID, openingBalance).Error; err != nil {
		return 0, err
	}
	var id int
	if err := r.db.Raw(`SELECT LAST_INSERT_ID()`).Scan(&id).Error; err != nil {
		return 0, err
	}
	return id, nil
}

func (r *cashDrawerRepo) Close(id int, closingBalance, expectedBalance, difference float64, notes string) error {
	return r.db.Exec(closeCashDrawerQuery, closingBalance, expectedBalance, difference, notes, id).Error
}

func (r *cashDrawerRepo) UpdateSales(id int, totalSales, totalCashSales float64) error {
	return r.db.Exec(updateSalesQuery, totalSales, totalCashSales, id).Error
}

func (r *cashDrawerRepo) UpdateExpenses(id int, totalExpenses float64) error {
	return r.db.Exec(updateExpensesQuery, totalExpenses, id).Error
}
