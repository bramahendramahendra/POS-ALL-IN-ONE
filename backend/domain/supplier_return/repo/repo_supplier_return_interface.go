package repo_supplier_return

import (
	dto_supplier_return "permen_api/domain/supplier_return/dto"
	model_supplier_return "permen_api/domain/supplier_return/model"
)

type SupplierReturnRepo interface {
	GetAll(filter *dto_supplier_return.SupplierReturnFilter) ([]*dto_supplier_return.SupplierReturnResponse, int, error)
	GetByID(id int) (*dto_supplier_return.SupplierReturnResponse, error)
	GetStatus(id int) (string, error)
	GetItems(returnID int) ([]model_supplier_return.SupplierReturnItem, error)
	Create(req *dto_supplier_return.CreateSupplierReturnRequest, userID int) (*dto_supplier_return.SupplierReturnResponse, error)
	UpdateStatus(id int, status, notes string) error
	ApproveWithStockReduction(id int, userID int) error
	Delete(id int) error
}
