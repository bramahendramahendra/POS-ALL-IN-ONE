package repo_master

import model_master "permen_api/domain/master/model"

type CategoryRepo interface {
	GetAll() ([]*model_master.Category, error)
	GetByID(id int) (*model_master.Category, error)
	GetByName(name string) (*model_master.Category, error)
	CheckNameExists(name string, excludeID int) (bool, error)
	CountProductsByCategory(categoryID int) (int, error)
	Create(name, description string) (int64, error)
	Update(id int, name, description string) error
	Delete(id int) error
}
