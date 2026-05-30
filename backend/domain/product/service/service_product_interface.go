package service_product

import (
	"mime/multipart"

	dto_product "pos_api/domain/product/dto"
)

type ProductService interface {
	GetAll(filter *dto_product.ProductFilter) ([]*dto_product.ProductResponse, int, error)
	GetCategoryNames() ([]string, error)
	GetUnitNames() ([]string, error)
	GetUnitInfos() ([]*dto_product.UnitInfo, error)
	GetByID(id int) (*dto_product.ProductResponse, error)
	GetByBarcode(barcode string) (*dto_product.ProductResponse, error)
	Search(keyword string, limit int) ([]*dto_product.ProductSearchResult, error)
	GetLowStock() ([]*dto_product.LowStockProduct, error)
	GenerateBarcode() (*dto_product.GenerateBarcodeResponse, error)
	GenerateSku(categoryID int) (*dto_product.GenerateSkuResponse, error)
	Create(req *dto_product.ProductRequest) (*dto_product.ProductResponse, error)
	Update(id int, req *dto_product.ProductRequest) error
	Delete(id int) error
	ToggleStatus(id int) error
	ImportFromFile(file *multipart.FileHeader) (*dto_product.ImportResult, error)
	ImportBulk(req dto_product.BulkImportRequest) (*dto_product.BulkImportResult, error)
	ImportPreview(file *multipart.FileHeader) (*dto_product.ImportPreviewResponse, error)
}
