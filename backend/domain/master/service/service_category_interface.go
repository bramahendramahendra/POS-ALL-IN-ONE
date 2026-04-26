package service_master

import dto_master "permen_api/domain/master/dto"

type CategoryService interface {
	GetAll() ([]*dto_master.CategoryResponse, error)
	GetByID(id int) (*dto_master.CategoryResponse, error)
	Create(req *dto_master.CreateCategoryRequest) (*dto_master.CategoryResponse, error)
	Update(id int, req *dto_master.UpdateCategoryRequest) error
	Delete(id int) error
}
