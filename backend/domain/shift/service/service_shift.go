package service_shift

import (
	dto_shift "permen_api/domain/shift/dto"
	repo_shift "permen_api/domain/shift/repo"
	"permen_api/errors"
)

type shiftService struct {
	repo repo_shift.ShiftRepo
}

func NewShiftService(repo repo_shift.ShiftRepo) ShiftService {
	return &shiftService{repo: repo}
}

func (s *shiftService) GetAll() ([]*dto_shift.ShiftResponse, error) {
	items, err := s.repo.GetAll()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return items, nil
}

func (s *shiftService) GetActive() ([]*dto_shift.ShiftActiveResponse, error) {
	items, err := s.repo.GetActive()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return items, nil
}

func (s *shiftService) GetByID(id int) (*dto_shift.ShiftResponse, error) {
	item, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if item == nil {
		return nil, &errors.NotFoundError{Message: "Shift tidak ditemukan"}
	}
	return item, nil
}

func (s *shiftService) Create(req *dto_shift.ShiftRequest) (*dto_shift.ShiftResponse, error) {
	id, err := s.repo.Create(req)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	item, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return item, nil
}

func (s *shiftService) Update(id int, req *dto_shift.ShiftRequest) error {
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if existing == nil {
		return &errors.NotFoundError{Message: "Shift tidak ditemukan"}
	}
	if err := s.repo.Update(id, req); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *shiftService) Delete(id int) error {
	count, _ := s.repo.CountOpenCashDrawer(id)
	if count > 0 {
		return &errors.BadRequestError{Message: "Shift tidak bisa dihapus karena sedang digunakan"}
	}
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if existing == nil {
		return &errors.NotFoundError{Message: "Shift tidak ditemukan"}
	}
	if err := s.repo.Delete(id); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *shiftService) ToggleStatus(id int) error {
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if existing == nil {
		return &errors.NotFoundError{Message: "Shift tidak ditemukan"}
	}
	if err := s.repo.ToggleStatus(id); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *shiftService) GetSummary() ([]*dto_shift.ShiftSummaryResponse, error) {
	items, err := s.repo.GetSummary()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return items, nil
}
