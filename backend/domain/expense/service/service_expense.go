package service_expense

import (
	dto_expense "permen_api/domain/expense/dto"
	repo_expense "permen_api/domain/expense/repo"
	repo_cash_drawer "permen_api/domain/cash_drawer/repo"
	"permen_api/errors"
)

type expenseService struct {
	repo           repo_expense.ExpenseRepo
	cashDrawerRepo repo_cash_drawer.CashDrawerRepo
}

func NewExpenseService(repo repo_expense.ExpenseRepo, cashDrawerRepo repo_cash_drawer.CashDrawerRepo) ExpenseService {
	return &expenseService{repo: repo, cashDrawerRepo: cashDrawerRepo}
}

func (s *expenseService) GetAll(filter *dto_expense.ExpenseFilter) ([]*dto_expense.ExpenseResponse, int, error) {
	items, total, err := s.repo.GetAll(filter)
	if err != nil {
		return nil, 0, &errors.InternalServerError{Message: err.Error()}
	}
	return items, total, nil
}

func (s *expenseService) GetByID(id int) (*dto_expense.ExpenseResponse, error) {
	item, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if item == nil {
		return nil, &errors.NotFoundError{Message: "Pengeluaran tidak ditemukan"}
	}
	return item, nil
}

func (s *expenseService) Create(req *dto_expense.ExpenseRequest, userID int) (*dto_expense.ExpenseResponse, error) {
	id, err := s.repo.Create(req, userID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	openCashDrawer, _ := s.cashDrawerRepo.GetOpenCashDrawer(userID)
	if openCashDrawer != nil {
		_ = s.cashDrawerRepo.UpdateExpenses(openCashDrawer.ID, req.Amount)
	}

	item, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return item, nil
}

func (s *expenseService) Update(id int, req *dto_expense.ExpenseRequest) error {
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if existing == nil {
		return &errors.NotFoundError{Message: "Pengeluaran tidak ditemukan"}
	}
	if err := s.repo.Update(id, req); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *expenseService) Delete(id int) error {
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if existing == nil {
		return &errors.NotFoundError{Message: "Pengeluaran tidak ditemukan"}
	}
	if err := s.repo.Delete(id); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}
