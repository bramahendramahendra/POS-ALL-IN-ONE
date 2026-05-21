package repo_cash_drawer

import (
	dto_cash_drawer "pos_api/domain/cash_drawer/dto"
	model_cash_drawer "pos_api/domain/cash_drawer/model"
)

type CashDrawerRepo interface {
	GetCurrent(userID int) (*dto_cash_drawer.CurrentCashDrawerResponse, error)
	GetOpenCashDrawer(userID int) (*model_cash_drawer.CashDrawer, error)
	GetByID(id int) (*model_cash_drawer.CashDrawer, error)
	GetDetailByID(id int) (*dto_cash_drawer.CashDrawerDetailResponse, error)
	GetHistory(filter *dto_cash_drawer.CashDrawerFilter) ([]*dto_cash_drawer.CashDrawerHistoryResponse, int, error)
	Open(userID int, shiftID *int, openingBalance float64, notes string) (int, error)
	Close(id int, closingBalance, expectedBalance, difference float64, notes string) error
	UpdateSales(id int, totalSales, totalCashSales float64) error
	UpdateExpenses(id int, totalExpenses float64) error
}
