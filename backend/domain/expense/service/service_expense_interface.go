package service_expense

import dto_expense "permen_api/domain/expense/dto"

type ExpenseService interface {
	GetAll(filter *dto_expense.ExpenseFilter) ([]*dto_expense.ExpenseResponse, int, error)
	GetByID(id int) (*dto_expense.ExpenseResponse, error)
	Create(req *dto_expense.ExpenseRequest, userID int) (*dto_expense.ExpenseResponse, error)
	Update(id int, req *dto_expense.ExpenseRequest) error
	Delete(id int) error
}
