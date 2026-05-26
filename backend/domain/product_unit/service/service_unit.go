package service_product_unit

import (
	"strings"

	dto_product_unit "pos_api/domain/product_unit/dto"
	model_product_unit "pos_api/domain/product_unit/model"
	repo_product_unit "pos_api/domain/product_unit/repo"
	"pos_api/errors"
)

type unitService struct {
	repo repo_product_unit.UnitRepo
}

func NewUnitService(repo repo_product_unit.UnitRepo) UnitService {
	return &unitService{repo: repo}
}

func (s *unitService) GetAll() ([]*dto_product_unit.UnitResponse, error) {
	units, err := s.repo.GetAll()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	result := make([]*dto_product_unit.UnitResponse, 0, len(units))
	for _, u := range units {
		result = append(result, toUnitResponse(u))
	}
	return result, nil
}

func (s *unitService) GetActive() ([]*dto_product_unit.UnitActiveResponse, error) {
	units, err := s.repo.GetActive()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	result := make([]*dto_product_unit.UnitActiveResponse, 0, len(units))
	for _, u := range units {
		result = append(result, toUnitActiveResponse(u))
	}
	return result, nil
}

func (s *unitService) GetByID(id int) (*dto_product_unit.UnitResponse, error) {
	u, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if u == nil {
		return nil, &errors.NotFoundError{Message: "Satuan tidak ditemukan"}
	}
	return toUnitResponse(u), nil
}

func (s *unitService) Create(req *dto_product_unit.CreateUnitRequest) (*dto_product_unit.UnitResponse, error) {
	req.Name = strings.TrimSpace(req.Name)
	req.Abbreviation = strings.TrimSpace(req.Abbreviation)
	exists, err := s.repo.CheckNameExists(req.Name, 0)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if exists {
		return nil, &errors.BadRequestError{Message: "Nama satuan sudah digunakan"}
	}

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

func (s *unitService) Update(id int, req *dto_product_unit.UpdateUnitRequest) error {
	req.Name = strings.TrimSpace(req.Name)
	req.Abbreviation = strings.TrimSpace(req.Abbreviation)
	u, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if u == nil {
		return &errors.NotFoundError{Message: "Satuan tidak ditemukan"}
	}

	exists, err := s.repo.CheckNameExists(req.Name, id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if exists {
		return &errors.BadRequestError{Message: "Nama satuan sudah digunakan"}
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

func toUnitResponse(u *model_product_unit.Unit) *dto_product_unit.UnitResponse {
	return &dto_product_unit.UnitResponse{
		ID:           u.ID,
		Name:         u.Name,
		Abbreviation: u.Abbreviation,
		IsActive:     u.IsActive,
	}
}

func toUnitActiveResponse(u *model_product_unit.Unit) *dto_product_unit.UnitActiveResponse {
	return &dto_product_unit.UnitActiveResponse{
		ID:           u.ID,
		Name:         u.Name,
		Abbreviation: u.Abbreviation,
	}
}
