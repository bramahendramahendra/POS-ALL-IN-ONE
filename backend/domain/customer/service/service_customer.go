package service_customer

import (
	"fmt"

	dto_customer "permen_api/domain/customer/dto"
	repo_customer "permen_api/domain/customer/repo"
	"permen_api/errors"
)

type customerService struct {
	repo repo_customer.CustomerRepo
}

func NewCustomerService(repo repo_customer.CustomerRepo) CustomerService {
	return &customerService{repo: repo}
}

func (s *customerService) GetAll(filter *dto_customer.CustomerFilter) ([]*dto_customer.CustomerResponse, int, error) {
	return s.repo.GetAll(filter)
}

func (s *customerService) GetActiveList() ([]*dto_customer.CustomerActiveItem, error) {
	return s.repo.GetActiveList()
}

func (s *customerService) GetByID(id int) (*dto_customer.CustomerDetailResponse, error) {
	c, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if c == nil {
		return nil, &errors.NotFoundError{Message: "Pelanggan tidak ditemukan"}
	}

	return &dto_customer.CustomerDetailResponse{
		ID:           c.ID,
		CustomerCode: c.CustomerCode,
		Name:         c.Name,
		Phone:        c.Phone,
		Address:      c.Address,
		CreditLimit:  c.CreditLimit,
		Notes:        c.Notes,
		IsActive:     c.IsActive,
	}, nil
}

func (s *customerService) Create(req *dto_customer.CustomerRequest) (*dto_customer.CustomerResponse, error) {
	count, err := s.repo.GetCount()
	if err != nil {
		return nil, err
	}
	code := fmt.Sprintf("CUS-%03d", count+1)
	return s.repo.Create(code, req)
}

func (s *customerService) Update(id int, req *dto_customer.CustomerRequest) (*dto_customer.CustomerResponse, error) {
	c, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if c == nil {
		return nil, &errors.NotFoundError{Message: "Pelanggan tidak ditemukan"}
	}
	return s.repo.Update(id, req)
}

func (s *customerService) Delete(id int) error {
	c, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if c == nil {
		return &errors.NotFoundError{Message: "Pelanggan tidak ditemukan"}
	}

	count, err := s.repo.CountActiveReceivables(id)
	if err != nil {
		return err
	}
	if count > 0 {
		return &errors.BadRequestError{Message: "Pelanggan masih memiliki piutang aktif"}
	}
	return s.repo.Delete(id)
}

func (s *customerService) ToggleStatus(id int) error {
	c, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if c == nil {
		return &errors.NotFoundError{Message: "Pelanggan tidak ditemukan"}
	}
	return s.repo.ToggleStatus(id)
}
