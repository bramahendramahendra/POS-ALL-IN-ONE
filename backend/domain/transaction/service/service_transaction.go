package service_transaction

import (
	"strings"

	dto_transaction "permen_api/domain/transaction/dto"
	repo_transaction "permen_api/domain/transaction/repo"
	"permen_api/errors"
)

type transactionService struct {
	repo repo_transaction.TransactionRepo
}

func NewTransactionService(repo repo_transaction.TransactionRepo) TransactionService {
	return &transactionService{repo: repo}
}

func (s *transactionService) GetAll(filter *dto_transaction.TransactionFilter) ([]*dto_transaction.TransactionResponse, int, error) {
	transactions, total, err := s.repo.GetAll(filter)
	if err != nil {
		return nil, 0, &errors.InternalServerError{Message: err.Error()}
	}
	return transactions, total, nil
}

func (s *transactionService) GetByID(id int) (*dto_transaction.TransactionResponse, error) {
	t, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if t == nil {
		return nil, &errors.NotFoundError{Message: "Transaksi tidak ditemukan"}
	}
	return t, nil
}

func (s *transactionService) Create(req *dto_transaction.CreateTransactionRequest, userID int) (*dto_transaction.CreateTransactionResponse, error) {
	resp, err := s.repo.Create(req, userID)
	if err != nil {
		if strings.HasPrefix(err.Error(), "stok_insufficient:") {
			name := strings.TrimPrefix(err.Error(), "stok_insufficient:")
			return nil, &errors.BadRequestError{Message: "Stok tidak mencukupi untuk " + name}
		}
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return resp, nil
}

func (s *transactionService) Void(id, userID int) error {
	t, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if t == nil {
		return &errors.NotFoundError{Message: "Transaksi tidak ditemukan"}
	}
	if t.Status == "void" {
		return &errors.BadRequestError{Message: "Transaksi sudah di-void"}
	}

	if err := s.repo.Void(id, userID); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}
