package service_product

import (
	dto_product "permen_api/domain/product/dto"
	model_product "permen_api/domain/product/model"
	repo_product "permen_api/domain/product/repo"
	"permen_api/errors"
)

type productService struct {
	repo repo_product.ProductRepo
}

func NewProductService(repo repo_product.ProductRepo) ProductService {
	return &productService{repo: repo}
}

func (s *productService) GetAll(filter *dto_product.ProductFilter) ([]*dto_product.ProductResponse, int, error) {
	products, total, err := s.repo.GetAll(filter)
	if err != nil {
		return nil, 0, &errors.InternalServerError{Message: err.Error()}
	}
	return products, total, nil
}

func (s *productService) GetByID(id int) (*dto_product.ProductResponse, error) {
	p, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if p == nil {
		return nil, &errors.NotFoundError{Message: "Produk tidak ditemukan"}
	}
	return toProductResponse(p, ""), nil
}

func (s *productService) GetByBarcode(barcode string) (*dto_product.ProductResponse, error) {
	p, err := s.repo.GetByBarcode(barcode)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if p == nil {
		return nil, &errors.NotFoundError{Message: "Produk tidak ditemukan"}
	}
	return toProductResponse(p, ""), nil
}

func (s *productService) Search(keyword string, limit int) ([]*dto_product.ProductSearchResult, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}
	results, err := s.repo.Search(keyword, limit)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return results, nil
}

func (s *productService) GetLowStock() ([]*dto_product.LowStockProduct, error) {
	results, err := s.repo.GetLowStock()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return results, nil
}

func (s *productService) Create(req *dto_product.ProductRequest) (*dto_product.ProductResponse, error) {
	if req.Barcode != "" {
		exists, err := s.repo.CheckBarcodeExists(req.Barcode, 0)
		if err != nil {
			return nil, &errors.InternalServerError{Message: err.Error()}
		}
		if exists {
			return nil, &errors.BadRequestError{Message: "Barcode sudah digunakan"}
		}
	}

	newID, err := s.repo.Create(req)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	created, err := s.repo.GetByID(int(newID))
	if err != nil || created == nil {
		return nil, &errors.InternalServerError{Message: "Gagal mengambil data produk baru"}
	}
	return toProductResponse(created, ""), nil
}

func (s *productService) Update(id int, req *dto_product.ProductRequest) error {
	p, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if p == nil {
		return &errors.NotFoundError{Message: "Produk tidak ditemukan"}
	}

	if req.Barcode != "" {
		exists, err := s.repo.CheckBarcodeExists(req.Barcode, id)
		if err != nil {
			return &errors.InternalServerError{Message: err.Error()}
		}
		if exists {
			return &errors.BadRequestError{Message: "Barcode sudah digunakan"}
		}
	}

	return s.repo.Update(id, req)
}

func (s *productService) Delete(id int) error {
	p, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if p == nil {
		return &errors.NotFoundError{Message: "Produk tidak ditemukan"}
	}

	count, err := s.repo.CountTransactionItems(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if count > 0 {
		return &errors.BadRequestError{Message: "Produk tidak bisa dihapus karena sudah ada di transaksi"}
	}

	return s.repo.Delete(id)
}

func (s *productService) ToggleStatus(id int) error {
	p, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if p == nil {
		return &errors.NotFoundError{Message: "Produk tidak ditemukan"}
	}
	return s.repo.ToggleStatus(id)
}

func toProductResponse(p *model_product.Product, categoryName string) *dto_product.ProductResponse {
	return &dto_product.ProductResponse{
		ID:            p.ID,
		Barcode:       p.Barcode,
		Name:          p.Name,
		CategoryID:    p.CategoryID,
		CategoryName:  categoryName,
		PurchasePrice: p.PurchasePrice,
		SellingPrice:  p.SellingPrice,
		Stock:         p.Stock,
		MinStock:      p.MinStock,
		Unit:          p.Unit,
		IsActive:      p.IsActive,
	}
}
