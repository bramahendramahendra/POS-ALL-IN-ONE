package service_product

import (
	dto_product "permen_api/domain/product/dto"
	repo_product "permen_api/domain/product/repo"
	"permen_api/errors"
)

type ProductPriceService interface {
	GetByProduct(productID int) ([]*dto_product.ProductPriceResponse, error)
	Save(productID int, prices []dto_product.ProductPriceRequest) error
}

type productPriceService struct {
	repo     repo_product.ProductPriceRepo
	prodRepo repo_product.ProductRepo
}

func NewProductPriceService(repo repo_product.ProductPriceRepo, prodRepo repo_product.ProductRepo) ProductPriceService {
	return &productPriceService{repo: repo, prodRepo: prodRepo}
}

func (s *productPriceService) GetByProduct(productID int) ([]*dto_product.ProductPriceResponse, error) {
	if err := s.checkProductExists(productID); err != nil {
		return nil, err
	}
	prices, err := s.repo.GetByProduct(productID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return prices, nil
}

func (s *productPriceService) Save(productID int, prices []dto_product.ProductPriceRequest) error {
	if err := s.checkProductExists(productID); err != nil {
		return err
	}
	if err := s.repo.Save(productID, prices); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *productPriceService) checkProductExists(productID int) error {
	p, err := s.prodRepo.GetByID(productID)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if p == nil {
		return &errors.NotFoundError{Message: "Produk tidak ditemukan"}
	}
	return nil
}
