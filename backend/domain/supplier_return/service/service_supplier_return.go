package service_supplier_return

import (
	dto_supplier_return "permen_api/domain/supplier_return/dto"
	repo_supplier_return "permen_api/domain/supplier_return/repo"
	"permen_api/errors"
)

type supplierReturnService struct {
	repo repo_supplier_return.SupplierReturnRepo
}

func NewSupplierReturnService(repo repo_supplier_return.SupplierReturnRepo) SupplierReturnService {
	return &supplierReturnService{repo: repo}
}

func (s *supplierReturnService) GetAll(filter *dto_supplier_return.SupplierReturnFilter) ([]*dto_supplier_return.SupplierReturnResponse, int, error) {
	items, total, err := s.repo.GetAll(filter)
	if err != nil {
		return nil, 0, &errors.InternalServerError{Message: err.Error()}
	}
	return items, total, nil
}

func (s *supplierReturnService) GetByID(id int) (*dto_supplier_return.SupplierReturnResponse, error) {
	item, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if item == nil {
		return nil, &errors.NotFoundError{Message: "Retur supplier tidak ditemukan"}
	}
	return item, nil
}

func (s *supplierReturnService) Create(req *dto_supplier_return.CreateSupplierReturnRequest, userID int) (*dto_supplier_return.SupplierReturnResponse, error) {
	item, err := s.repo.Create(req, userID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return item, nil
}

func (s *supplierReturnService) UpdateStatus(id int, req *dto_supplier_return.UpdateStatusRequest, userID int) error {
	current, err := s.repo.GetStatus(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if current == "" {
		return &errors.NotFoundError{Message: "Retur supplier tidak ditemukan"}
	}
	if current == "approved" {
		return &errors.BadRequestError{Message: "Retur yang sudah approved tidak bisa diubah"}
	}

	if req.Status == "approved" {
		if err := s.repo.ApproveWithStockReduction(id, userID); err != nil {
			return &errors.InternalServerError{Message: err.Error()}
		}
		return nil
	}

	if err := s.repo.UpdateStatus(id, req.Status, req.Notes); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *supplierReturnService) Delete(id int) error {
	current, err := s.repo.GetStatus(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if current == "" {
		return &errors.NotFoundError{Message: "Retur supplier tidak ditemukan"}
	}
	if current == "approved" {
		return &errors.BadRequestError{Message: "Retur yang sudah approved tidak bisa dihapus"}
	}

	if err := s.repo.Delete(id); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}
