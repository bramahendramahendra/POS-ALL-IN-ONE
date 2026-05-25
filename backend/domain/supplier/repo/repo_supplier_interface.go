package repo_supplier

import (
	dto_supplier "pos_api/domain/supplier/dto"
	model_supplier "pos_api/domain/supplier/model"
)

type SupplierRepo interface {
	GetAll(filter *dto_supplier.SupplierFilter) ([]*dto_supplier.SupplierResponse, int, error)
	GetActiveList() ([]*dto_supplier.SupplierActiveItem, error)
	GetByID(id int) (*model_supplier.Supplier, error)
	GetPurchaseHistory(supplierID int) ([]dto_supplier.SupplierPurchaseItem, error)
	GetReturnHistory(supplierID int) ([]dto_supplier.SupplierReturnHistoryItem, error)
	GetCount() (int, error)
	CountPurchasesBySupplier(supplierID int) (int, error)
	Create(code string, req *dto_supplier.SupplierRequest) (*dto_supplier.SupplierResponse, error)
	Update(id int, req *dto_supplier.SupplierRequest) (*dto_supplier.SupplierResponse, error)
	Delete(id int) error
	ToggleStatus(id int) error
}
