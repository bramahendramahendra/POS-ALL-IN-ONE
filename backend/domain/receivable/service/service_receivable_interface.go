package service_receivable

import dto_receivable "permen_api/domain/receivable/dto"

type ReceivableService interface {
	GetAll(filter *dto_receivable.ReceivableFilter) ([]*dto_receivable.ReceivableResponse, int, error)
	GetByID(id int) (*dto_receivable.ReceivableDetailResponse, error)
	GetSummary() ([]*dto_receivable.ReceivableSummaryItem, error)
	GetPayments(id int) ([]*dto_receivable.PaymentResponse, error)
	Pay(id int, req *dto_receivable.PayRequest, userID int) (*dto_receivable.PayResponse, error)
}
