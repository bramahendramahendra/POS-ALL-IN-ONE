package repo_payment_status

import dto_payment_status "pos_api/domain/payment_status/dto"

type PaymentStatusRepo interface {
	GetAll() ([]*dto_payment_status.PaymentStatusResponse, error)
}
