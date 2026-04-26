package service_cash_drawer

import dto_cash_drawer "permen_api/domain/cash_drawer/dto"

type CashDrawerService interface {
	GetCurrent(userID int) (*dto_cash_drawer.CurrentCashDrawerResponse, error)
	GetByID(id int) (*dto_cash_drawer.CashDrawerHistoryResponse, error)
	GetHistory(filter *dto_cash_drawer.CashDrawerFilter) ([]*dto_cash_drawer.CashDrawerHistoryResponse, int, error)
	Open(userID int, req *dto_cash_drawer.OpenRequest) (*dto_cash_drawer.OpenResponse, error)
	Close(id int, req *dto_cash_drawer.CloseRequest) (*dto_cash_drawer.CloseResponse, error)
	UpdateSales(id int, req *dto_cash_drawer.UpdateSalesRequest) error
	UpdateExpenses(id int, req *dto_cash_drawer.UpdateExpensesRequest) error
}
