package service_supplier_return

import dto_supplier_return "permen_api/domain/supplier_return/dto"

type SupplierReturnService interface {
	GetAll(filter *dto_supplier_return.SupplierReturnFilter) ([]*dto_supplier_return.SupplierReturnResponse, int, error)
	GetByID(id int) (*dto_supplier_return.SupplierReturnResponse, error)
	Create(req *dto_supplier_return.CreateSupplierReturnRequest, userID int) (*dto_supplier_return.SupplierReturnResponse, error)
	UpdateStatus(id int, req *dto_supplier_return.UpdateStatusRequest, userID int) error
	Delete(id int) error
}
