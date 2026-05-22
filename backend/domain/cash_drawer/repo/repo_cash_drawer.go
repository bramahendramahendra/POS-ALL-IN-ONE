package repo_cash_drawer

import (
	"fmt"

	dto_cash_drawer "pos_api/domain/cash_drawer/dto"
	model_cash_drawer "pos_api/domain/cash_drawer/model"

	"gorm.io/gorm"
)

const (
	getCurrentCashDrawerQuery  = `SELECT cd.id, cd.user_id, u.full_name as user_name, cd.shift_id, s.name as shift_name, s.start_time as shift_start, s.end_time as shift_end, cd.open_time, cd.opening_balance, cd.total_sales, cd.total_cash_sales, cd.total_expenses, cd.expected_balance, cd.status, cd.open_notes FROM cash_drawer cd LEFT JOIN users u ON cd.user_id = u.id LEFT JOIN shifts s ON cd.shift_id = s.id WHERE cd.user_id = ? AND cd.status = 'open' LIMIT 1`
	getOpenCashDrawerQuery     = `SELECT id, user_id, shift_id, open_time, opening_balance, total_sales, total_cash_sales, total_expenses, expected_balance, status FROM cash_drawer WHERE user_id = ? AND status = 'open' LIMIT 1`
	getCashDrawerByIDQuery     = `SELECT id, user_id, shift_id, open_time, close_time, opening_balance, closing_balance, total_sales, total_cash_sales, total_expenses, expected_balance, difference, status, notes FROM cash_drawer WHERE id = ? LIMIT 1`
	openCashDrawerQuery        = `INSERT INTO cash_drawer (user_id, shift_id, open_time, opening_balance, open_notes, status) VALUES (?, ?, NOW(), ?, ?, 'open')`
	closeCashDrawerQuery       = `UPDATE cash_drawer SET close_time = NOW(), closing_balance = ?, expected_balance = ?, difference = ?, status = 'closed', notes = ?, updated_at = NOW() WHERE id = ?`
	updateSalesQuery           = `UPDATE cash_drawer SET total_sales = total_sales + ?, total_cash_sales = total_cash_sales + ?, expected_balance = opening_balance + total_cash_sales - total_expenses, updated_at = NOW() WHERE id = ?`
	updateExpensesQuery        = `UPDATE cash_drawer SET total_expenses = total_expenses + ?, expected_balance = opening_balance + total_cash_sales - total_expenses, updated_at = NOW() WHERE id = ?`
	getCashDrawerHistoryBase   = `SELECT cd.id, u.full_name as user_name, s.name as shift_name, cd.open_time, cd.close_time, cd.opening_balance, cd.closing_balance, cd.expected_balance, CASE WHEN cd.status = 'closed' THEN cd.difference ELSE NULL END as difference, cd.total_sales, cd.total_cash_sales, cd.total_expenses, cd.status FROM cash_drawer cd LEFT JOIN users u ON cd.user_id = u.id LEFT JOIN shifts s ON cd.shift_id = s.id WHERE 1=1`
	countCashDrawerHistoryBase = `SELECT COUNT(*) FROM cash_drawer cd WHERE 1=1`

	getCashDrawerDetailQuery = `
		SELECT cd.id, cd.user_id, u.full_name as cashier_name, s.name as shift_name,
		       s.start_time as shift_start, s.end_time as shift_end,
		       cd.open_time, cd.close_time, cd.opening_balance, cd.closing_balance,
		       cd.expected_balance, cd.total_cash_sales, cd.total_expenses,
		       CASE WHEN cd.status = 'closed' THEN cd.difference ELSE NULL END as difference,
		       cd.status, cd.notes, cd.open_notes
		FROM cash_drawer cd
		LEFT JOIN users u ON cd.user_id = u.id
		LEFT JOIN shifts s ON cd.shift_id = s.id
		WHERE cd.id = ? LIMIT 1`

	// next_open_time: open_time sesi berikutnya milik user yang sama, digunakan sebagai
	// batas atas transaksi agar sesi-sesi yang berurutan tidak tumpang tindih.
	// Batas atas efektif = LEAST(close_time, next_open_time), fallback ke NOW().
	getCashDrawerTransactionsQuery = `
		SELECT t.transaction_date,
		       t.transaction_code,
		       COALESCE(c.name, '') as customer_name,
		       t.total_amount
		FROM transactions t
		LEFT JOIN customers c ON t.customer_id = c.id
		WHERE t.user_id = ?
		  AND t.payment_method = 'cash'
		  AND t.status = 'completed'
		  AND t.transaction_date >= ?
		  AND t.transaction_date < COALESCE(?, ?, NOW())
		ORDER BY t.transaction_date ASC`

	getCashDrawerExpensesQuery = `
		SELECT e.category, e.description, e.amount
		FROM expenses e
		WHERE e.user_id = ?
		  AND e.created_at >= ?
		  AND e.created_at < COALESCE(?, ?, NOW())
		ORDER BY e.created_at ASC`

	getNextSessionOpenTimeQuery = `
		SELECT MIN(open_time) FROM cash_drawer
		WHERE user_id = ? AND open_time > ? AND id != ?`
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
		conditions += " AND cd.open_time >= ?"
		args = append(args, filter.StartDate)
		countArgs = append(countArgs, filter.StartDate)
	}
	if filter.EndDate != "" {
		conditions += " AND cd.open_time < DATE_ADD(?, INTERVAL 1 DAY)"
		args = append(args, filter.EndDate)
		countArgs = append(countArgs, filter.EndDate)
	}
	if filter.UserID != nil {
		conditions += " AND cd.user_id = ?"
		args = append(args, *filter.UserID)
		countArgs = append(countArgs, *filter.UserID)
	}
	if filter.ShiftID != nil {
		conditions += " AND cd.shift_id = ?"
		args = append(args, *filter.ShiftID)
		countArgs = append(countArgs, *filter.ShiftID)
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
			&item.Difference, &item.TotalSales, &item.TotalCashSales, &item.TotalExpenses,
			&item.Status,
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

func (r *cashDrawerRepo) GetDetailByID(id int) (*dto_cash_drawer.CashDrawerDetailResponse, error) {
	var res dto_cash_drawer.CashDrawerDetailResponse
	result := r.db.Raw(getCashDrawerDetailQuery, id).Scan(&res)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}

	// Cari open_time sesi berikutnya milik user yang sama sebagai batas atas transaksi.
	// Ini mencegah transaksi sesi berikutnya masuk ke detail sesi ini.
	var nextOpenTime *string
	r.db.Raw(getNextSessionOpenTimeQuery, res.UserID, res.OpenTime, res.ID).Scan(&nextOpenTime)

	if err := r.db.Raw(getCashDrawerTransactionsQuery, res.UserID, res.OpenTime, res.CloseTime, nextOpenTime).Scan(&res.Transactions).Error; err != nil {
		return nil, err
	}
	if res.Transactions == nil {
		res.Transactions = []dto_cash_drawer.CashDrawerTransaction{}
	}

	if err := r.db.Raw(getCashDrawerExpensesQuery, res.UserID, res.OpenTime, res.CloseTime, nextOpenTime).Scan(&res.Expenses).Error; err != nil {
		return nil, err
	}
	if res.Expenses == nil {
		res.Expenses = []dto_cash_drawer.CashDrawerExpenseItem{}
	}

	return &res, nil
}

func (r *cashDrawerRepo) Open(userID int, shiftID *int, openingBalance float64, notes string) (int, error) {
	var id int
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(openCashDrawerQuery, userID, shiftID, openingBalance, notes).Error; err != nil {
			return err
		}
		return tx.Raw(`SELECT LAST_INSERT_ID()`).Scan(&id).Error
	})
	if err != nil {
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
