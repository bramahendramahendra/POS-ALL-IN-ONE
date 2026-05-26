package service_product_category

import (
	"fmt"
	"strings"
	"unicode"

	dto_product_category "pos_api/domain/product_category/dto"
	model_product_category "pos_api/domain/product_category/model"
	repo_product_category "pos_api/domain/product_category/repo"
	"pos_api/errors"
)

type categoryService struct {
	repo repo_product_category.CategoryRepo
}

func NewCategoryService(repo repo_product_category.CategoryRepo) CategoryService {
	return &categoryService{repo: repo}
}

func (s *categoryService) GetAll() ([]*dto_product_category.CategoryResponse, error) {
	categories, err := s.repo.GetAll()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	result := make([]*dto_product_category.CategoryResponse, 0, len(categories))
	for _, c := range categories {
		result = append(result, toCategoryResponse(c))
	}
	return result, nil
}

func (s *categoryService) GetByID(id int) (*dto_product_category.CategoryResponse, error) {
	c, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if c == nil {
		return nil, &errors.NotFoundError{Message: "Kategori tidak ditemukan"}
	}
	return toCategoryResponse(c), nil
}

func (s *categoryService) Create(req *dto_product_category.CreateCategoryRequest) (*dto_product_category.CategoryResponse, error) {
	req.Name = strings.TrimSpace(req.Name)
	req.Description = strings.TrimSpace(req.Description)
	exists, err := s.repo.CheckNameExists(req.Name, 0)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if exists {
		return nil, &errors.BadRequestError{Message: "Nama kategori sudah digunakan"}
	}

	code, err := s.generateUniqueCode(req.Name)
	if err != nil {
		return nil, err
	}

	newID, err := s.repo.Create(req.Name, code, req.Description)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	created, err := s.repo.GetByID(int(newID))
	if err != nil || created == nil {
		return nil, &errors.InternalServerError{Message: "Gagal mengambil data kategori baru"}
	}
	return toCategoryResponse(created), nil
}

// generateUniqueCode membuat kode 3 huruf dari nama kategori, unik di DB.
// Contoh: "Minuman" → "MIN", jika sudah ada → "MIN2", "MIN3", dst.
func (s *categoryService) generateUniqueCode(name string) (string, error) {
	letters := strings.Map(func(r rune) rune {
		if unicode.IsLetter(r) {
			return unicode.ToUpper(r)
		}
		return -1
	}, name)

	base := letters
	if len(base) > 3 {
		base = base[:3]
	}
	for len(base) < 3 {
		base += "X"
	}

	candidate := base
	for i := 2; i <= 99; i++ {
		exists, err := s.repo.CheckCodeExists(candidate)
		if err != nil {
			return "", &errors.InternalServerError{Message: err.Error()}
		}
		if !exists {
			return candidate, nil
		}
		candidate = fmt.Sprintf("%s%d", base, i)
	}
	return "", &errors.InternalServerError{Message: "Tidak bisa generate kode kategori yang unik"}
}

func (s *categoryService) Update(id int, req *dto_product_category.UpdateCategoryRequest) error {
	req.Name = strings.TrimSpace(req.Name)
	req.Description = strings.TrimSpace(req.Description)
	c, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if c == nil {
		return &errors.NotFoundError{Message: "Kategori tidak ditemukan"}
	}

	exists, err := s.repo.CheckNameExists(req.Name, id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if exists {
		return &errors.BadRequestError{Message: "Nama kategori sudah digunakan"}
	}

	return s.repo.Update(id, req.Name, req.Description)
}

func (s *categoryService) Delete(id int) error {
	c, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if c == nil {
		return &errors.NotFoundError{Message: "Kategori tidak ditemukan"}
	}

	count, err := s.repo.CountProductsByCategory(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if count > 0 {
		return &errors.BadRequestError{Message: "Kategori masih digunakan oleh produk"}
	}

	return s.repo.Delete(id)
}

func (s *categoryService) ToggleStatus(id int) error {
	c, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if c == nil {
		return &errors.NotFoundError{Message: "Kategori tidak ditemukan"}
	}

	if c.IsActive {
		activeCount, err := s.repo.CountActiveProductsByCategory(id)
		if err != nil {
			return &errors.InternalServerError{Message: err.Error()}
		}
		if activeCount > 0 {
			return &errors.BadRequestError{Message: "Kategori tidak bisa dinonaktifkan karena masih memiliki produk aktif"}
		}
	}

	return s.repo.ToggleStatus(id)
}

func toCategoryResponse(c *model_product_category.Category) *dto_product_category.CategoryResponse {
	return &dto_product_category.CategoryResponse{
		ID:                 c.ID,
		Name:               c.Name,
		Code:               c.Code,
		Description:        c.Description,
		IsActive:           c.IsActive,
		ProductCount:       c.ProductCount,
		ActiveProductCount: c.ActiveProductCount,
		CreatedAt:          c.CreatedAt,
	}
}
