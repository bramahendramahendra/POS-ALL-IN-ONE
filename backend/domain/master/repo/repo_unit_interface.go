package repo_master

import model_master "permen_api/domain/master/model"

type UnitRepo interface {
	GetAll() ([]*model_master.Unit, error)
	GetActive() ([]*model_master.Unit, error)
	GetByID(id int) (*model_master.Unit, error)
	CountProductUnitsByUnit(unitID int) (int, error)
	Create(name, abbreviation string) (int64, error)
	Update(id int, name, abbreviation string) error
	Delete(id int) error
	ToggleStatus(id int) error
}
