package service_product_unit

import dto_product_unit "pos_api/domain/product_unit/dto"

type UnitService interface {
	GetAll() ([]*dto_product_unit.UnitResponse, error)
	GetActive() ([]*dto_product_unit.UnitActiveResponse, error)
	GetByID(id int) (*dto_product_unit.UnitResponse, error)
	Create(req *dto_product_unit.CreateUnitRequest) (*dto_product_unit.UnitResponse, error)
	Update(id int, req *dto_product_unit.UpdateUnitRequest) error
	Delete(id int) error
	ToggleStatus(id int) error
}
