package repo_product

import (
	dto_product "permen_api/domain/product/dto"
	model_product "permen_api/domain/product/model"
)

type ProductRepo interface {
	GetAll(filter *dto_product.ProductFilter) ([]*dto_product.ProductResponse, int, error)
	GetByID(id int) (*model_product.Product, error)
	GetByBarcode(barcode string) (*model_product.Product, error)
	Search(keyword string, limit int) ([]*dto_product.ProductSearchResult, error)
	GetLowStock() ([]*dto_product.LowStockProduct, error)
	CheckBarcodeExists(barcode string, excludeID int) (bool, error)
	CountTransactionItems(productID int) (int, error)
	Create(req *dto_product.ProductRequest) (int64, error)
	Update(id int, req *dto_product.ProductRequest) error
	Delete(id int) error
	ToggleStatus(id int) error
	UpdateStock(id int, delta float64) error
}
