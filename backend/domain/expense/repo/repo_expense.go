package repo_expense

import (
	"fmt"

	dto_expense "permen_api/domain/expense/dto"

	"gorm.io/gorm"
)

const (
	getAllExpensesQuery = `SELECT e.id, e.expense_date, e.category, e.description, e.amount, e.payment_method, u.full_name as user_name, e.notes FROM expenses e LEFT JOIN users u ON e.user_id = u.id WHERE 1=1`
	countExpensesBase  = `SELECT COUNT(*) FROM expenses e WHERE 1=1`
	getExpenseByIDQuery = `SELECT e.id, e.expense_date, e.category, e.description, e.amount, e.payment_method, e.user_id, u.full_name as user_name, e.notes FROM expenses e LEFT JOIN users u ON e.user_id = u.id WHERE e.id = ?`
	createExpenseQuery  = `INSERT INTO expenses (expense_date, category, description, amount, payment_method, user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`
	updateExpenseQuery  = `UPDATE expenses SET expense_date=?, category=?, description=?, amount=?, payment_method=?, notes=?, updated_at=NOW() WHERE id=?`
	deleteExpenseQuery  = `DELETE FROM expenses WHERE id = ?`
)

type expenseRepo struct {
	db *gorm.DB
}

func NewExpenseRepo(db *gorm.DB) ExpenseRepo {
	return &expenseRepo{db: db}
}

func (r *expenseRepo) GetAll(filter *dto_expense.ExpenseFilter) ([]*dto_expense.ExpenseResponse, int, error) {
	var args, countArgs []interface{}
	conditions := ""

	if filter.StartDate != "" {
		conditions += " AND DATE(e.expense_date) >= ?"
		args = append(args, filter.StartDate)
		countArgs = append(countArgs, filter.StartDate)
	}
	if filter.EndDate != "" {
		conditions += " AND DATE(e.expense_date) <= ?"
		args = append(args, filter.EndDate)
		countArgs = append(countArgs, filter.EndDate)
	}
	if filter.Category != "" {
		conditions += " AND e.category = ?"
		args = append(args, filter.Category)
		countArgs = append(countArgs, filter.Category)
	}
	if filter.UserID != nil {
		conditions += " AND e.user_id = ?"
		args = append(args, *filter.UserID)
		countArgs = append(countArgs, *filter.UserID)
	}

	var total int
	if err := r.db.Raw(countExpensesBase+conditions, countArgs...).Scan(&total).Error; err != nil {
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

	query := getAllExpensesQuery + conditions + fmt.Sprintf(" ORDER BY e.expense_date DESC, e.id DESC LIMIT %d OFFSET %d", limit, offset)

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []*dto_expense.ExpenseResponse
	for rows.Next() {
		var item dto_expense.ExpenseResponse
		if err := rows.Scan(
			&item.ID, &item.ExpenseDate, &item.Category, &item.Description,
			&item.Amount, &item.PaymentMethod, &item.UserName, &item.Notes,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, &item)
	}
	if items == nil {
		items = []*dto_expense.ExpenseResponse{}
	}
	return items, total, nil
}

func (r *expenseRepo) GetByID(id int) (*dto_expense.ExpenseResponse, error) {
	var item dto_expense.ExpenseResponse
	result := r.db.Raw(getExpenseByIDQuery, id).Scan(&item)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &item, nil
}

func (r *expenseRepo) Create(req *dto_expense.ExpenseRequest, userID int) (int, error) {
	if err := r.db.Exec(createExpenseQuery,
		req.ExpenseDate, req.Category, req.Description,
		req.Amount, req.PaymentMethod, userID, req.Notes,
	).Error; err != nil {
		return 0, err
	}
	var id int
	if err := r.db.Raw(`SELECT LAST_INSERT_ID()`).Scan(&id).Error; err != nil {
		return 0, err
	}
	return id, nil
}

func (r *expenseRepo) Update(id int, req *dto_expense.ExpenseRequest) error {
	return r.db.Exec(updateExpenseQuery,
		req.ExpenseDate, req.Category, req.Description,
		req.Amount, req.PaymentMethod, req.Notes, id,
	).Error
}

func (r *expenseRepo) Delete(id int) error {
	return r.db.Exec(deleteExpenseQuery, id).Error
}
