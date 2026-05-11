package repo_expense

import dto_expense "pos_api/domain/expense/dto"

type ExpenseRepo interface {
	GetAll(filter *dto_expense.ExpenseFilter) ([]*dto_expense.ExpenseResponse, int, error)
	GetByID(id int) (*dto_expense.ExpenseResponse, error)
	Create(req *dto_expense.ExpenseRequest, userID int) (int, error)
	Update(id int, req *dto_expense.ExpenseRequest) error
	Delete(id int) error
	// UpdateFromSync menerapkan data desktop (approve) ke tabel expenses
	UpdateFromSync(id int, data map[string]interface{}) error
}
