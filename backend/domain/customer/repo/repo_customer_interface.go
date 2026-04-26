package repo_customer

import (
	dto_customer "permen_api/domain/customer/dto"
	model_customer "permen_api/domain/customer/model"
)

type CustomerRepo interface {
	GetAll(filter *dto_customer.CustomerFilter) ([]*dto_customer.CustomerResponse, int, error)
	GetActiveList() ([]*dto_customer.CustomerActiveItem, error)
	GetByID(id int) (*model_customer.Customer, error)
	GetCount() (int, error)
	CountActiveReceivables(customerID int) (int, error)
	Create(code string, req *dto_customer.CustomerRequest) (*dto_customer.CustomerResponse, error)
	Update(id int, req *dto_customer.CustomerRequest) (*dto_customer.CustomerResponse, error)
	Delete(id int) error
	ToggleStatus(id int) error
}
