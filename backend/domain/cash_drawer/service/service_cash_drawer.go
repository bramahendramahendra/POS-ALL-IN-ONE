package service_cash_drawer

import (
	dto_cash_drawer "permen_api/domain/cash_drawer/dto"
	repo_cash_drawer "permen_api/domain/cash_drawer/repo"
	"permen_api/errors"
)

type cashDrawerService struct {
	repo repo_cash_drawer.CashDrawerRepo
}

func NewCashDrawerService(repo repo_cash_drawer.CashDrawerRepo) CashDrawerService {
	return &cashDrawerService{repo: repo}
}

func (s *cashDrawerService) GetCurrent(userID int) (*dto_cash_drawer.CurrentCashDrawerResponse, error) {
	res, err := s.repo.GetCurrent(userID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return res, nil
}

func (s *cashDrawerService) GetByID(id int) (*dto_cash_drawer.CashDrawerHistoryResponse, error) {
	cd, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if cd == nil {
		return nil, &errors.NotFoundError{Message: "Kas tidak ditemukan"}
	}

	res := &dto_cash_drawer.CashDrawerHistoryResponse{
		ID:              cd.ID,
		OpenTime:        cd.OpenTime,
		CloseTime:       cd.CloseTime,
		OpeningBalance:  cd.OpeningBalance,
		ClosingBalance:  cd.ClosingBalance,
		ExpectedBalance: cd.ExpectedBalance,
		Difference:      cd.Difference,
		TotalSales:      cd.TotalSales,
		Status:          cd.Status,
	}
	return res, nil
}

func (s *cashDrawerService) GetHistory(filter *dto_cash_drawer.CashDrawerFilter) ([]*dto_cash_drawer.CashDrawerHistoryResponse, int, error) {
	items, total, err := s.repo.GetHistory(filter)
	if err != nil {
		return nil, 0, &errors.InternalServerError{Message: err.Error()}
	}
	return items, total, nil
}

func (s *cashDrawerService) Open(userID int, req *dto_cash_drawer.OpenRequest) (*dto_cash_drawer.OpenResponse, error) {
	existing, err := s.repo.GetOpenCashDrawer(userID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if existing != nil {
		return nil, &errors.BadRequestError{Message: "Sudah ada kas yang terbuka"}
	}

	id, err := s.repo.Open(userID, req.ShiftID, req.OpeningBalance)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return &dto_cash_drawer.OpenResponse{ID: id}, nil
}

func (s *cashDrawerService) Close(id int, req *dto_cash_drawer.CloseRequest) (*dto_cash_drawer.CloseResponse, error) {
	current, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if current == nil {
		return nil, &errors.NotFoundError{Message: "Kas tidak ditemukan"}
	}
	if current.Status != "open" {
		return nil, &errors.BadRequestError{Message: "Kas sudah ditutup"}
	}

	expected := current.OpeningBalance + current.TotalCashSales - current.TotalExpenses
	difference := req.ClosingBalance - expected

	if err := s.repo.Close(id, req.ClosingBalance, expected, difference, req.Notes); err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	return &dto_cash_drawer.CloseResponse{
		ExpectedBalance: expected,
		ClosingBalance:  req.ClosingBalance,
		Difference:      difference,
	}, nil
}

func (s *cashDrawerService) UpdateSales(id int, req *dto_cash_drawer.UpdateSalesRequest) error {
	cd, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if cd == nil {
		return &errors.NotFoundError{Message: "Kas tidak ditemukan"}
	}

	if err := s.repo.UpdateSales(id, req.TotalSales, req.TotalCashSales); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *cashDrawerService) UpdateExpenses(id int, req *dto_cash_drawer.UpdateExpensesRequest) error {
	cd, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if cd == nil {
		return &errors.NotFoundError{Message: "Kas tidak ditemukan"}
	}

	if err := s.repo.UpdateExpenses(id, req.TotalExpenses); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}
