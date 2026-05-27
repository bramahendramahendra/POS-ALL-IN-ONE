package repo_payment_method

import dto_payment_method "pos_api/domain/payment_method/dto"

type PaymentMethodRepo interface {
	GetAll() ([]*dto_payment_method.PaymentMethodResponse, error)
}
