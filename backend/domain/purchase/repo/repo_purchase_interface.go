package repo_purchase

import (
	dto_purchase "permen_api/domain/purchase/dto"
	model_purchase "permen_api/domain/purchase/model"
)

type PurchaseRepo interface {
	GetAll(filter *dto_purchase.PurchaseFilter) ([]*dto_purchase.PurchaseResponse, int, error)
	GetByID(id int) (*dto_purchase.PurchaseResponse, error)
	GetItems(purchaseID int) ([]model_purchase.PurchaseItem, error)
	Create(req *dto_purchase.PurchaseRequest, userID int) (*dto_purchase.PurchaseResponse, error)
	Update(id int, req *dto_purchase.PurchaseRequest) (*dto_purchase.PurchaseResponse, error)
	Delete(id int) error
	Pay(id int, amount float64) error
	GetRawByID(id int) (*model_purchase.Purchase, error)
}
