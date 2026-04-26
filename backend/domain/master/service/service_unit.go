package service_master

import (
	dto_master "permen_api/domain/master/dto"
	model_master "permen_api/domain/master/model"
	repo_master "permen_api/domain/master/repo"
	"permen_api/errors"
)

type unitService struct {
	repo repo_master.UnitRepo
}

func NewUnitService(repo repo_master.UnitRepo) UnitService {
	return &unitService{repo: repo}
}

func (s *unitService) GetAll() ([]*dto_master.UnitResponse, error) {
	units, err := s.repo.GetAll()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	result := make([]*dto_master.UnitResponse, 0, len(units))
	for _, u := range units {
		result = append(result, toUnitResponse(u))
	}
	return result, nil
}

func (s *unitService) GetActive() ([]*dto_master.UnitActiveResponse, error) {
	units, err := s.repo.GetActive()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	result := make([]*dto_master.UnitActiveResponse, 0, len(units))
	for _, u := range units {
		result = append(result, toUnitActiveResponse(u))
	}
	return result, nil
}

func (s *unitService) GetByID(id int) (*dto_master.UnitResponse, error) {
	u, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if u == nil {
		return nil, &errors.NotFoundError{Message: "Satuan tidak ditemukan"}
	}
	return toUnitResponse(u), nil
}

func (s *unitService) Create(req *dto_master.CreateUnitRequest) (*dto_master.UnitResponse, error) {
	newID, err := s.repo.Create(req.Name, req.Abbreviation)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	created, err := s.repo.GetByID(int(newID))
	if err != nil || created == nil {
		return nil, &errors.InternalServerError{Message: "Gagal mengambil data satuan baru"}
	}
	return toUnitResponse(created), nil
}

func (s *unitService) Update(id int, req *dto_master.UpdateUnitRequest) error {
	u, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if u == nil {
		return &errors.NotFoundError{Message: "Satuan tidak ditemukan"}
	}
	return s.repo.Update(id, req.Name, req.Abbreviation)
}

func (s *unitService) Delete(id int) error {
	u, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if u == nil {
		return &errors.NotFoundError{Message: "Satuan tidak ditemukan"}
	}

	count, err := s.repo.CountProductUnitsByUnit(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if count > 0 {
		return &errors.BadRequestError{Message: "Satuan masih digunakan oleh produk"}
	}

	return s.repo.Delete(id)
}

func (s *unitService) ToggleStatus(id int) error {
	u, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if u == nil {
		return &errors.NotFoundError{Message: "Satuan tidak ditemukan"}
	}
	return s.repo.ToggleStatus(id)
}

func toUnitResponse(u *model_master.Unit) *dto_master.UnitResponse {
	return &dto_master.UnitResponse{
		ID:           u.ID,
		Name:         u.Name,
		Abbreviation: u.Abbreviation,
		IsActive:     u.IsActive,
	}
}

func toUnitActiveResponse(u *model_master.Unit) *dto_master.UnitActiveResponse {
	return &dto_master.UnitActiveResponse{
		ID:           u.ID,
		Name:         u.Name,
		Abbreviation: u.Abbreviation,
	}
}
