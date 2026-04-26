package repo_stock_mutation

import dto_stock_mutation "permen_api/domain/stock_mutation/dto"

type StockMutationRepo interface {
	GetAll(filter *dto_stock_mutation.StockMutationFilter) ([]*dto_stock_mutation.StockMutationResponse, int, error)
	GetByProduct(productID int) ([]*dto_stock_mutation.StockMutationByProductResponse, error)
}
