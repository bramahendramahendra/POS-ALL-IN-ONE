package service_cash_drawer

import (
	dto_cash_drawer "pos_api/domain/cash_drawer/dto"
	repo_cash_drawer "pos_api/domain/cash_drawer/repo"
	"pos_api/errors"
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

func (s *cashDrawerService) GetByID(id int, requestingUserID int, role string) (*dto_cash_drawer.CashDrawerDetailResponse, error) {
	res, err := s.repo.GetDetailByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if res == nil {
		return nil, &errors.NotFoundError{Message: "Kas tidak ditemukan"}
	}
	if role != "owner" && role != "admin" && res.UserID != requestingUserID {
		return nil, &errors.UnauthorizededError{Message: "Anda tidak memiliki akses ke kas ini"}
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
	if req.OpeningBalance < 0 {
		return nil, &errors.BadRequestError{Message: "Saldo awal tidak boleh negatif"}
	}

	existing, err := s.repo.GetOpenCashDrawer(userID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if existing != nil {
		return nil, &errors.BadRequestError{Message: "Sudah ada kas yang terbuka"}
	}

	id, err := s.repo.Open(userID, req.ShiftID, req.OpeningBalance, req.Notes)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return &dto_cash_drawer.OpenResponse{ID: id}, nil
}

func (s *cashDrawerService) Close(id int, req *dto_cash_drawer.CloseRequest, requestingUserID int, role string) (*dto_cash_drawer.CloseResponse, error) {
	if req.ClosingBalance < 0 {
		return nil, &errors.BadRequestError{Message: "Saldo akhir tidak boleh negatif"}
	}

	current, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if current == nil {
		return nil, &errors.NotFoundError{Message: "Kas tidak ditemukan"}
	}
	if role != "owner" && role != "admin" && current.UserID != requestingUserID {
		return nil, &errors.UnauthorizededError{Message: "Anda tidak memiliki akses ke kas ini"}
	}
	if current.Status != "open" {
		return nil, &errors.BadRequestError{Message: "Kas sudah ditutup"}
	}

	expected := current.ExpectedBalance
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

func (s *cashDrawerService) UpdateSales(id int, req *dto_cash_drawer.UpdateSalesRequest, requestingUserID int, role string) error {
	cd, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if cd == nil {
		return &errors.NotFoundError{Message: "Kas tidak ditemukan"}
	}
	if role != "owner" && role != "admin" && cd.UserID != requestingUserID {
		return &errors.UnauthorizededError{Message: "Anda tidak memiliki akses ke kas ini"}
	}
	if cd.Status != "open" {
		return &errors.BadRequestError{Message: "Kas sudah ditutup"}
	}

	if err := s.repo.UpdateSales(id, req.TotalSales, req.TotalCashSales); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *cashDrawerService) UpdateExpenses(id int, req *dto_cash_drawer.UpdateExpensesRequest, requestingUserID int, role string) error {
	cd, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if cd == nil {
		return &errors.NotFoundError{Message: "Kas tidak ditemukan"}
	}
	if role != "owner" && role != "admin" && cd.UserID != requestingUserID {
		return &errors.UnauthorizededError{Message: "Anda tidak memiliki akses ke kas ini"}
	}
	if cd.Status != "open" {
		return &errors.BadRequestError{Message: "Kas sudah ditutup"}
	}

	if err := s.repo.UpdateExpenses(id, req.TotalExpenses); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}
