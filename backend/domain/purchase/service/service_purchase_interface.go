package service_purchase

import dto_purchase "permen_api/domain/purchase/dto"

type PurchaseService interface {
	GetAll(filter *dto_purchase.PurchaseFilter) ([]*dto_purchase.PurchaseResponse, int, error)
	GetByID(id int) (*dto_purchase.PurchaseResponse, error)
	GetItems(purchaseID int) ([]dto_purchase.PurchaseItemResponse, error)
	Create(req *dto_purchase.PurchaseRequest, userID int) (*dto_purchase.PurchaseResponse, error)
	Update(id int, req *dto_purchase.PurchaseRequest) (*dto_purchase.PurchaseResponse, error)
	Delete(id int) error
	Pay(id int, req *dto_purchase.PayPurchaseRequest) error
}
