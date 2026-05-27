package service_payment_method

import dto_payment_method "pos_api/domain/payment_method/dto"

type PaymentMethodService interface {
	GetAll() ([]*dto_payment_method.PaymentMethodResponse, error)
}
