package service_receivable

import (
	"fmt"

	dto_receivable "permen_api/domain/receivable/dto"
	repo_receivable "permen_api/domain/receivable/repo"
	"permen_api/errors"
)


type receivableService struct {
	repo repo_receivable.ReceivableRepo
}

func NewReceivableService(repo repo_receivable.ReceivableRepo) ReceivableService {
	return &receivableService{repo: repo}
}

func (s *receivableService) GetAll(filter *dto_receivable.ReceivableFilter) ([]*dto_receivable.ReceivableResponse, int, error) {
	return s.repo.GetAll(filter)
}

func (s *receivableService) GetByID(id int) (*dto_receivable.ReceivableDetailResponse, error) {
	detail, err := s.repo.GetDetailByID(id)
	if err != nil {
		return nil, err
	}
	if detail == nil {
		return nil, &errors.NotFoundError{Message: "Piutang tidak ditemukan"}
	}
	return detail, nil
}

func (s *receivableService) GetSummary() ([]*dto_receivable.ReceivableSummaryItem, error) {
	return s.repo.GetSummary()
}

func (s *receivableService) GetPayments(id int) ([]*dto_receivable.PaymentResponse, error) {
	rec, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if rec == nil {
		return nil, &errors.NotFoundError{Message: "Piutang tidak ditemukan"}
	}
	return s.repo.GetPayments(id)
}

func (s *receivableService) Pay(id int, req *dto_receivable.PayRequest, userID int) (*dto_receivable.PayResponse, error) {
	rec, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if rec == nil {
		return nil, &errors.NotFoundError{Message: "Piutang tidak ditemukan"}
	}
	if rec.Status == "paid" {
		return nil, &errors.BadRequestError{Message: "Piutang sudah lunas"}
	}
	if req.Amount > rec.RemainingAmount {
		return nil, &errors.BadRequestError{
			Message: fmt.Sprintf("Jumlah bayar (%.0f) melebihi sisa piutang (%.0f)", req.Amount, rec.RemainingAmount),
		}
	}

	if err := s.repo.CreatePayment(id, req, userID); err != nil {
		return nil, err
	}
	if err := s.repo.UpdateAfterPayment(id, req.Amount); err != nil {
		return nil, err
	}

	newPaid := rec.PaidAmount + req.Amount
	newRemaining := rec.RemainingAmount - req.Amount
	status := "partial"
	if newRemaining <= 0 {
		status = "paid"
	}

	return &dto_receivable.PayResponse{
		ReceivableID:    id,
		PaidAmount:      newPaid,
		RemainingAmount: newRemaining,
		Status:          status,
	}, nil
}
