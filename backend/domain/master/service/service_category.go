package service_master

import (
	dto_master "permen_api/domain/master/dto"
	model_master "permen_api/domain/master/model"
	repo_master "permen_api/domain/master/repo"
	"permen_api/errors"
)

type categoryService struct {
	repo repo_master.CategoryRepo
}

func NewCategoryService(repo repo_master.CategoryRepo) CategoryService {
	return &categoryService{repo: repo}
}

func (s *categoryService) GetAll() ([]*dto_master.CategoryResponse, error) {
	categories, err := s.repo.GetAll()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	result := make([]*dto_master.CategoryResponse, 0, len(categories))
	for _, c := range categories {
		result = append(result, toCategoryResponse(c))
	}
	return result, nil
}

func (s *categoryService) GetByID(id int) (*dto_master.CategoryResponse, error) {
	c, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if c == nil {
		return nil, &errors.NotFoundError{Message: "Kategori tidak ditemukan"}
	}
	return toCategoryResponse(c), nil
}

func (s *categoryService) Create(req *dto_master.CreateCategoryRequest) (*dto_master.CategoryResponse, error) {
	exists, err := s.repo.CheckNameExists(req.Name, 0)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if exists {
		return nil, &errors.BadRequestError{Message: "Nama kategori sudah digunakan"}
	}

	newID, err := s.repo.Create(req.Name, req.Description)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	created, err := s.repo.GetByID(int(newID))
	if err != nil || created == nil {
		return nil, &errors.InternalServerError{Message: "Gagal mengambil data kategori baru"}
	}
	return toCategoryResponse(created), nil
}

func (s *categoryService) Update(id int, req *dto_master.UpdateCategoryRequest) error {
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

func toCategoryResponse(c *model_master.Category) *dto_master.CategoryResponse {
	return &dto_master.CategoryResponse{
		ID:          c.ID,
		Name:        c.Name,
		Description: c.Description,
		CreatedAt:   c.CreatedAt,
	}
}
