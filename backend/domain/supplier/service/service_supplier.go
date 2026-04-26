package service_supplier

import (
	"fmt"

	dto_supplier "permen_api/domain/supplier/dto"
	repo_supplier "permen_api/domain/supplier/repo"
	"permen_api/errors"
)

type supplierService struct {
	repo repo_supplier.SupplierRepo
}

func NewSupplierService(repo repo_supplier.SupplierRepo) SupplierService {
	return &supplierService{repo: repo}
}

func (s *supplierService) GetAll(filter *dto_supplier.SupplierFilter) ([]*dto_supplier.SupplierResponse, int, error) {
	return s.repo.GetAll(filter)
}

func (s *supplierService) GetActiveList() ([]*dto_supplier.SupplierActiveItem, error) {
	return s.repo.GetActiveList()
}

func (s *supplierService) GetDetail(id int) (*dto_supplier.SupplierDetailResponse, error) {
	supplier, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if supplier == nil {
		return nil, &errors.NotFoundError{Message: "Supplier tidak ditemukan"}
	}

	purchases, _ := s.repo.GetPurchaseHistory(id)
	if purchases == nil {
		purchases = []dto_supplier.SupplierPurchaseItem{}
	}

	return &dto_supplier.SupplierDetailResponse{
		ID:              supplier.ID,
		SupplierCode:    supplier.SupplierCode,
		Name:            supplier.Name,
		Address:         supplier.Address,
		Phone:           supplier.Phone,
		Email:           supplier.Email,
		ContactPerson:   supplier.ContactPerson,
		Notes:           supplier.Notes,
		IsActive:        supplier.IsActive,
		PurchaseHistory: purchases,
	}, nil
}

func (s *supplierService) Create(req *dto_supplier.SupplierRequest) (*dto_supplier.SupplierResponse, error) {
	count, err := s.repo.GetCount()
	if err != nil {
		return nil, err
	}
	code := fmt.Sprintf("SUP-%03d", count+1)
	return s.repo.Create(code, req)
}

func (s *supplierService) Update(id int, req *dto_supplier.SupplierRequest) (*dto_supplier.SupplierResponse, error) {
	supplier, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if supplier == nil {
		return nil, &errors.NotFoundError{Message: "Supplier tidak ditemukan"}
	}
	return s.repo.Update(id, req)
}

func (s *supplierService) Delete(id int) error {
	supplier, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if supplier == nil {
		return &errors.NotFoundError{Message: "Supplier tidak ditemukan"}
	}

	count, err := s.repo.CountPurchasesBySupplier(id)
	if err != nil {
		return err
	}
	if count > 0 {
		return &errors.BadRequestError{Message: "Supplier tidak bisa dihapus karena sudah ada Purchase Order"}
	}
	return s.repo.Delete(id)
}

func (s *supplierService) ToggleStatus(id int) error {
	supplier, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if supplier == nil {
		return &errors.NotFoundError{Message: "Supplier tidak ditemukan"}
	}
	return s.repo.ToggleStatus(id)
}
