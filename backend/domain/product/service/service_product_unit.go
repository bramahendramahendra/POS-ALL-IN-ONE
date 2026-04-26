package service_product

import (
	dto_product "permen_api/domain/product/dto"
	repo_product "permen_api/domain/product/repo"
	"permen_api/errors"
)

type ProductUnitService interface {
	GetByProduct(productID int) ([]*dto_product.ProductUnitResponse, error)
	Save(productID int, units []dto_product.ProductUnitRequest) error
	DeleteOne(id, productID int) error
}

type productUnitService struct {
	repo     repo_product.ProductUnitRepo
	prodRepo repo_product.ProductRepo
}

func NewProductUnitService(repo repo_product.ProductUnitRepo, prodRepo repo_product.ProductRepo) ProductUnitService {
	return &productUnitService{repo: repo, prodRepo: prodRepo}
}

func (s *productUnitService) GetByProduct(productID int) ([]*dto_product.ProductUnitResponse, error) {
	if err := s.checkProductExists(productID); err != nil {
		return nil, err
	}
	units, err := s.repo.GetByProduct(productID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return units, nil
}

func (s *productUnitService) Save(productID int, units []dto_product.ProductUnitRequest) error {
	if err := s.checkProductExists(productID); err != nil {
		return err
	}
	if err := s.repo.Save(productID, units); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *productUnitService) DeleteOne(id, productID int) error {
	if err := s.checkProductExists(productID); err != nil {
		return err
	}
	if err := s.repo.DeleteOne(id, productID); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *productUnitService) checkProductExists(productID int) error {
	p, err := s.prodRepo.GetByID(productID)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if p == nil {
		return &errors.NotFoundError{Message: "Produk tidak ditemukan"}
	}
	return nil
}
