package repo_transaction

import (
	dto_transaction "permen_api/domain/transaction/dto"
	model_transaction "permen_api/domain/transaction/model"
)

type TransactionRepo interface {
	GetAll(filter *dto_transaction.TransactionFilter) ([]*dto_transaction.TransactionResponse, int, error)
	GetByID(id int) (*dto_transaction.TransactionResponse, error)
	Create(req *dto_transaction.CreateTransactionRequest, userID int) (*dto_transaction.CreateTransactionResponse, error)
	Void(id, userID int) error
	GetItems(transactionID int) ([]model_transaction.TransactionItem, error)
}
