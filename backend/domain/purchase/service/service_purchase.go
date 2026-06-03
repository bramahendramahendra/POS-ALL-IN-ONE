package service_purchase

import (
	dto_purchase "pos_api/domain/purchase/dto"
	repo_purchase "pos_api/domain/purchase/repo"
	"pos_api/errors"
)

type purchaseService struct {
	repo repo_purchase.PurchaseRepo
}

func NewPurchaseService(repo repo_purchase.PurchaseRepo) PurchaseService {
	return &purchaseService{repo: repo}
}

func (s *purchaseService) GetAll(filter *dto_purchase.PurchaseFilter) ([]*dto_purchase.PurchaseResponse, int, error) {
	items, total, err := s.repo.GetAll(filter)
	if err != nil {
		return nil, 0, &errors.InternalServerError{Message: err.Error()}
	}
	return items, total, nil
}

func (s *purchaseService) GetByID(id int) (*dto_purchase.PurchaseResponse, error) {
	item, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if item == nil {
		return nil, &errors.NotFoundError{Message: "Purchase order tidak ditemukan"}
	}
	return item, nil
}

func (s *purchaseService) GetItems(purchaseID int) ([]dto_purchase.PurchaseItemResponse, error) {
	modelItems, err := s.repo.GetItems(purchaseID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	var result []dto_purchase.PurchaseItemResponse
	for _, mi := range modelItems {
		result = append(result, dto_purchase.PurchaseItemResponse{
			ID:            mi.ID,
			ProductID:     mi.ProductID,
			Quantity:      mi.Quantity,
			Unit:          mi.Unit,
			PurchasePrice: mi.PurchasePrice,
			Subtotal:      mi.Subtotal,
		})
	}
	if result == nil {
		result = []dto_purchase.PurchaseItemResponse{}
	}
	return result, nil
}

func (s *purchaseService) GenerateCode() (*dto_purchase.GeneratePurchaseCodeResponse, error) {
	code, err := s.repo.GenerateCode()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return &dto_purchase.GeneratePurchaseCodeResponse{PurchaseCode: code}, nil
}

func (s *purchaseService) Create(req *dto_purchase.PurchaseRequest, userID int) (*dto_purchase.PurchaseResponse, error) {
	if req.PaymentMethod != "" {
		valid, err := s.repo.IsValidPaymentMethod(req.PaymentMethod)
		if err != nil {
			return nil, &errors.InternalServerError{Message: err.Error()}
		}
		if !valid {
			return nil, &errors.BadRequestError{Message: "Metode pembayaran tidak valid"}
		}
	}

	item, err := s.repo.Create(req, userID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return item, nil
}

func (s *purchaseService) Update(id int, req *dto_purchase.PurchaseRequest) (*dto_purchase.PurchaseResponse, error) {
	existing, err := s.repo.GetRawByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if existing == nil {
		return nil, &errors.NotFoundError{Message: "Purchase order tidak ditemukan"}
	}
	if existing.PaidAmount > 0 {
		return nil, &errors.BadRequestError{Message: "PO tidak bisa diedit karena sudah ada pembayaran"}
	}

	item, err := s.repo.Update(id, req)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return item, nil
}

func (s *purchaseService) Delete(id int) error {
	existing, err := s.repo.GetRawByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if existing == nil {
		return &errors.NotFoundError{Message: "Purchase order tidak ditemukan"}
	}
	if existing.PaidAmount > 0 {
		return &errors.BadRequestError{Message: "PO tidak bisa dihapus karena sudah ada pembayaran"}
	}

	if err := s.repo.Delete(id); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *purchaseService) Pay(id int, req *dto_purchase.PayPurchaseRequest, userID int) error {
	existing, err := s.repo.GetRawByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if existing == nil {
		return &errors.NotFoundError{Message: "Purchase order tidak ditemukan"}
	}
	if existing.PaymentStatus == "paid" {
		return &errors.BadRequestError{Message: "PO sudah lunas"}
	}
	if req.Amount > existing.RemainingAmount {
		return &errors.BadRequestError{Message: "Jumlah pembayaran melebihi sisa tagihan"}
	}

	valid, err := s.repo.IsValidPaymentMethod(req.PaymentMethod)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if !valid {
		return &errors.BadRequestError{Message: "Metode pembayaran tidak valid"}
	}

	if err := s.repo.Pay(id, req, userID); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *purchaseService) GetPayments(purchaseID int) ([]dto_purchase.PurchasePaymentResponse, error) {
	items, err := s.repo.GetPayments(purchaseID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return items, nil
}
