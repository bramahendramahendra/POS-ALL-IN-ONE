package repo_product_unit

import model_product_unit "pos_api/domain/product_unit/model"

type UnitRepo interface {
	GetAll() ([]*model_product_unit.Unit, error)
	GetActive() ([]*model_product_unit.Unit, error)
	GetByID(id int) (*model_product_unit.Unit, error)
	CheckNameExists(name string, excludeID int) (bool, error)
	CountProductUnitsByUnit(unitID int) (int, error)
	Create(name, abbreviation string) (int64, error)
	Update(id int, name, abbreviation string) error
	Delete(id int) error
	ToggleStatus(id int) error
}
