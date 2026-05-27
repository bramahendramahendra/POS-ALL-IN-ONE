package service_payment_method

import (
	dto_payment_method "pos_api/domain/payment_method/dto"
	repo_payment_method "pos_api/domain/payment_method/repo"
	"pos_api/errors"
)

type paymentMethodService struct {
	repo repo_payment_method.PaymentMethodRepo
}

func NewPaymentMethodService(repo repo_payment_method.PaymentMethodRepo) PaymentMethodService {
	return &paymentMethodService{repo: repo}
}

func (s *paymentMethodService) GetAll() ([]*dto_payment_method.PaymentMethodResponse, error) {
	items, err := s.repo.GetAll()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return items, nil
}
