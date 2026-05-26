package service_payment_status

import (
	dto_payment_status "pos_api/domain/payment_status/dto"
	repo_payment_status "pos_api/domain/payment_status/repo"
	"pos_api/errors"
)

type paymentStatusService struct {
	repo repo_payment_status.PaymentStatusRepo
}

func NewPaymentStatusService(repo repo_payment_status.PaymentStatusRepo) PaymentStatusService {
	return &paymentStatusService{repo: repo}
}

func (s *paymentStatusService) GetAll() ([]*dto_payment_status.PaymentStatusResponse, error) {
	items, err := s.repo.GetAll()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return items, nil
}
