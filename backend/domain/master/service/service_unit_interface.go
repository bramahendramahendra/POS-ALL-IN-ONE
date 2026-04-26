package service_master

import dto_master "permen_api/domain/master/dto"

type UnitService interface {
	GetAll() ([]*dto_master.UnitResponse, error)
	GetActive() ([]*dto_master.UnitActiveResponse, error)
	GetByID(id int) (*dto_master.UnitResponse, error)
	Create(req *dto_master.CreateUnitRequest) (*dto_master.UnitResponse, error)
	Update(id int, req *dto_master.UpdateUnitRequest) error
	Delete(id int) error
	ToggleStatus(id int) error
}
