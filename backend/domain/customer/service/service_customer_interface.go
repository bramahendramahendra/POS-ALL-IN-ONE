package service_customer

import dto_customer "permen_api/domain/customer/dto"

type CustomerService interface {
	GetAll(filter *dto_customer.CustomerFilter) ([]*dto_customer.CustomerResponse, int, error)
	GetActiveList() ([]*dto_customer.CustomerActiveItem, error)
	GetByID(id int) (*dto_customer.CustomerDetailResponse, error)
	Create(req *dto_customer.CustomerRequest) (*dto_customer.CustomerResponse, error)
	Update(id int, req *dto_customer.CustomerRequest) (*dto_customer.CustomerResponse, error)
	Delete(id int) error
	ToggleStatus(id int) error
}
