package repo_receivable

import (
	dto_receivable "permen_api/domain/receivable/dto"
	model_receivable "permen_api/domain/receivable/model"
)

type ReceivableRepo interface {
	GetAll(filter *dto_receivable.ReceivableFilter) ([]*dto_receivable.ReceivableResponse, int, error)
	GetByID(id int) (*model_receivable.Receivable, error)
	GetDetailByID(id int) (*dto_receivable.ReceivableDetailResponse, error)
	GetSummary() ([]*dto_receivable.ReceivableSummaryItem, error)
	GetPayments(receivableID int) ([]*dto_receivable.PaymentResponse, error)
	CreatePayment(receivableID int, req *dto_receivable.PayRequest, userID int) error
	UpdateAfterPayment(receivableID int, amount float64) error
}
