package repo_shift

import dto_shift "permen_api/domain/shift/dto"

type ShiftRepo interface {
	GetAll() ([]*dto_shift.ShiftResponse, error)
	GetActive() ([]*dto_shift.ShiftActiveResponse, error)
	GetByID(id int) (*dto_shift.ShiftResponse, error)
	CountOpenCashDrawer(shiftID int) (int, error)
	Create(req *dto_shift.ShiftRequest) (int, error)
	Update(id int, req *dto_shift.ShiftRequest) error
	Delete(id int) error
	ToggleStatus(id int) error
	GetSummary() ([]*dto_shift.ShiftSummaryResponse, error)
}
