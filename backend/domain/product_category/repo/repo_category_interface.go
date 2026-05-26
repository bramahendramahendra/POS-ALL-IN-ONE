package repo_product_category

import model_product_category "pos_api/domain/product_category/model"

type CategoryRepo interface {
	GetAll() ([]*model_product_category.Category, error)
	GetByID(id int) (*model_product_category.Category, error)
	GetByName(name string) (*model_product_category.Category, error)
	CheckNameExists(name string, excludeID int) (bool, error)
	CountProductsByCategory(categoryID int) (int, error)
	CountActiveProductsByCategory(categoryID int) (int, error)
	Create(name, code, description string) (int64, error)
	CreateWithGeneratedCode(name, description string) (int64, error)
	CheckCodeExists(code string) (bool, error)
	Update(id int, name, description string) error
	Delete(id int) error
	ToggleStatus(id int) error
}
