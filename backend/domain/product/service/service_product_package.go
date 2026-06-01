package service_product

import (
	dto_product "pos_api/domain/product/dto"
	repo_product "pos_api/domain/product/repo"
	"pos_api/errors"
)

type ProductPackageService interface {
	GetByProduct(productID int) ([]*dto_product.ProductPackageResponse, error)
	Save(productID int, packages []dto_product.ProductPackageRequest) error
	DeleteOne(id, productID int) error
}

type productPackageService struct {
	repo     repo_product.ProductPackageRepo
	prodRepo repo_product.ProductRepo
}

func NewProductPackageService(repo repo_product.ProductPackageRepo, prodRepo repo_product.ProductRepo) ProductPackageService {
	return &productPackageService{repo: repo, prodRepo: prodRepo}
}

func (s *productPackageService) GetByProduct(productID int) ([]*dto_product.ProductPackageResponse, error) {
	if err := s.checkProductExists(productID); err != nil {
		return nil, err
	}
	packages, err := s.repo.GetByProduct(productID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return packages, nil
}

func (s *productPackageService) Save(productID int, packages []dto_product.ProductPackageRequest) error {
	if err := s.checkProductExists(productID); err != nil {
		return err
	}
	if err := s.repo.Save(productID, packages); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *productPackageService) DeleteOne(id, productID int) error {
	if err := s.checkProductExists(productID); err != nil {
		return err
	}
	if err := s.repo.DeleteOne(id, productID); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *productPackageService) checkProductExists(productID int) error {
	p, err := s.prodRepo.GetByID(productID)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if p == nil {
		return &errors.NotFoundError{Message: "Produk tidak ditemukan"}
	}
	return nil
}
