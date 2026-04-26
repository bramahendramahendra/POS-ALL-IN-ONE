package service_supplier

import dto_supplier "permen_api/domain/supplier/dto"

type SupplierService interface {
	GetAll(filter *dto_supplier.SupplierFilter) ([]*dto_supplier.SupplierResponse, int, error)
	GetActiveList() ([]*dto_supplier.SupplierActiveItem, error)
	GetDetail(id int) (*dto_supplier.SupplierDetailResponse, error)
	Create(req *dto_supplier.SupplierRequest) (*dto_supplier.SupplierResponse, error)
	Update(id int, req *dto_supplier.SupplierRequest) (*dto_supplier.SupplierResponse, error)
	Delete(id int) error
	ToggleStatus(id int) error
}
