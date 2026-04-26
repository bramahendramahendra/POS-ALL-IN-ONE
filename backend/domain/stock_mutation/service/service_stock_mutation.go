package service_stock_mutation

import (
	dto_stock_mutation "permen_api/domain/stock_mutation/dto"
	repo_stock_mutation "permen_api/domain/stock_mutation/repo"
)

type stockMutationService struct {
	repo repo_stock_mutation.StockMutationRepo
}

func NewStockMutationService(repo repo_stock_mutation.StockMutationRepo) StockMutationService {
	return &stockMutationService{repo: repo}
}

func (s *stockMutationService) GetAll(filter *dto_stock_mutation.StockMutationFilter) ([]*dto_stock_mutation.StockMutationResponse, int, error) {
	return s.repo.GetAll(filter)
}

func (s *stockMutationService) GetByProduct(productID int) ([]*dto_stock_mutation.StockMutationByProductResponse, error) {
	return s.repo.GetByProduct(productID)
}
