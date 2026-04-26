package service_product

import dto_product "permen_api/domain/product/dto"

type ProductService interface {
	GetAll(filter *dto_product.ProductFilter) ([]*dto_product.ProductResponse, int, error)
	GetByID(id int) (*dto_product.ProductResponse, error)
	GetByBarcode(barcode string) (*dto_product.ProductResponse, error)
	Search(keyword string, limit int) ([]*dto_product.ProductSearchResult, error)
	GetLowStock() ([]*dto_product.LowStockProduct, error)
	Create(req *dto_product.ProductRequest) (*dto_product.ProductResponse, error)
	Update(id int, req *dto_product.ProductRequest) error
	Delete(id int) error
	ToggleStatus(id int) error
}
