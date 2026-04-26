package service_shift

import dto_shift "permen_api/domain/shift/dto"

type ShiftService interface {
	GetAll() ([]*dto_shift.ShiftResponse, error)
	GetActive() ([]*dto_shift.ShiftActiveResponse, error)
	GetByID(id int) (*dto_shift.ShiftResponse, error)
	Create(req *dto_shift.ShiftRequest) (*dto_shift.ShiftResponse, error)
	Update(id int, req *dto_shift.ShiftRequest) error
	Delete(id int) error
	ToggleStatus(id int) error
	GetSummary() ([]*dto_shift.ShiftSummaryResponse, error)
}
