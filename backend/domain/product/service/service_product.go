package service_product

import (
	"fmt"
	"mime/multipart"
	"strconv"
	"strings"

	dto_product "permen_api/domain/product/dto"
	model_product "permen_api/domain/product/model"
	repo_category "permen_api/domain/master/repo"
	repo_product "permen_api/domain/product/repo"
	"permen_api/errors"

	"github.com/xuri/excelize/v2"
)

type productService struct {
	repo     repo_product.ProductRepo
	catRepo  repo_category.CategoryRepo
}

func NewProductService(repo repo_product.ProductRepo, catRepo repo_category.CategoryRepo) ProductService {
	return &productService{repo: repo, catRepo: catRepo}
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

func (s *productService) ImportFromFile(file *multipart.FileHeader) (*dto_product.ImportResult, error) {
	src, err := file.Open()
	if err != nil {
		return nil, &errors.InternalServerError{Message: "Gagal membuka file"}
	}
	defer src.Close()

	f, err := excelize.OpenReader(src)
	if err != nil {
		return nil, &errors.BadRequestError{Message: "File tidak dapat dibaca sebagai Excel"}
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, &errors.BadRequestError{Message: "File tidak memiliki sheet"}
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return nil, &errors.InternalServerError{Message: "Gagal membaca baris file"}
	}

	result := &dto_product.ImportResult{Errors: []dto_product.ImportErrorDetail{}}

	if len(rows) <= 1 {
		return result, nil
	}

	for i, row := range rows[1:] {
		rowNum := i + 2

		getCol := func(idx int) string {
			if idx < len(row) {
				return strings.TrimSpace(row[idx])
			}
			return ""
		}

		name := getCol(1)
		sellingPriceStr := getCol(4)

		if name == "" || sellingPriceStr == "" {
			result.Failed++
			result.Errors = append(result.Errors, dto_product.ImportErrorDetail{
				Row:     rowNum,
				Message: "Kolom name dan selling_price wajib diisi",
			})
			continue
		}

		sellingPrice, err := strconv.ParseFloat(sellingPriceStr, 64)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, dto_product.ImportErrorDetail{
				Row:     rowNum,
				Message: fmt.Sprintf("selling_price tidak valid: %s", sellingPriceStr),
			})
			continue
		}

		req := &dto_product.ProductRequest{
			Barcode:      getCol(0),
			Name:         name,
			SellingPrice: sellingPrice,
			Unit:         getCol(7),
		}

		if v := getCol(3); v != "" {
			if pp, err := strconv.ParseFloat(v, 64); err == nil {
				req.PurchasePrice = pp
			}
		}
		if v := getCol(5); v != "" {
			if st, err := strconv.ParseFloat(v, 64); err == nil {
				req.Stock = st
			}
		}
		if v := getCol(6); v != "" {
			if ms, err := strconv.ParseFloat(v, 64); err == nil {
				req.MinStock = ms
			}
		}

		if categoryName := getCol(2); categoryName != "" {
			cat, err := s.catRepo.GetByName(categoryName)
			if err != nil {
				result.Failed++
				result.Errors = append(result.Errors, dto_product.ImportErrorDetail{
					Row:     rowNum,
					Message: fmt.Sprintf("Gagal mencari kategori: %s", categoryName),
				})
				continue
			}
			if cat == nil {
				newID, err := s.catRepo.Create(categoryName, "")
				if err != nil {
					result.Failed++
					result.Errors = append(result.Errors, dto_product.ImportErrorDetail{
						Row:     rowNum,
						Message: fmt.Sprintf("Gagal membuat kategori: %s", categoryName),
					})
					continue
				}
				id := int(newID)
				req.CategoryID = &id
			} else {
				req.CategoryID = &cat.ID
			}
		}

		if req.Barcode != "" {
			exists, err := s.repo.CheckBarcodeExists(req.Barcode, 0)
			if err != nil {
				result.Failed++
				result.Errors = append(result.Errors, dto_product.ImportErrorDetail{
					Row:     rowNum,
					Message: "Gagal memeriksa barcode",
				})
				continue
			}
			if exists {
				result.Failed++
				result.Errors = append(result.Errors, dto_product.ImportErrorDetail{
					Row:     rowNum,
					Message: fmt.Sprintf("Barcode sudah digunakan: %s", req.Barcode),
				})
				continue
			}
		}

		if _, err := s.repo.Create(req); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, dto_product.ImportErrorDetail{
				Row:     rowNum,
				Message: "Gagal menyimpan produk",
			})
			continue
		}

		result.Success++
	}

	return result, nil
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
