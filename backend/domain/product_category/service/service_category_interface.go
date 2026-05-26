package service_product_category

import dto_product_category "pos_api/domain/product_category/dto"

type CategoryService interface {
	GetAll() ([]*dto_product_category.CategoryResponse, error)
	GetByID(id int) (*dto_product_category.CategoryResponse, error)
	Create(req *dto_product_category.CreateCategoryRequest) (*dto_product_category.CategoryResponse, error)
	Update(id int, req *dto_product_category.UpdateCategoryRequest) error
	Delete(id int) error
	ToggleStatus(id int) error
}
