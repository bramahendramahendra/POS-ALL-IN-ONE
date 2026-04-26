package service_pin

import (
	repo_pin "permen_api/domain/pin/repo"
	"permen_api/errors"
	"permen_api/pkg/bcrypt"
)

type pinService struct {
	repo repo_pin.PinRepo
}

func NewPinService(repo repo_pin.PinRepo) PinService {
	return &pinService{repo: repo}
}

func (s *pinService) HasPin(userID int) (bool, error) {
	pinHash, err := s.repo.GetPinHash(userID)
	if err != nil {
		return false, &errors.InternalServerError{Message: err.Error()}
	}
	return pinHash != "", nil
}

func (s *pinService) SetPin(userID int, pin string) error {
	hasPin, err := s.HasPin(userID)
	if err != nil {
		return err
	}
	if hasPin {
		return &errors.BadRequestError{Message: "PIN sudah ada, gunakan endpoint ubah PIN"}
	}
	hashed, err := bcrypt.HashPassword(pin)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if err := s.repo.SetPinHash(userID, hashed); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *pinService) VerifyPin(userID int, pin string) (bool, error) {
	pinHash, err := s.repo.GetPinHash(userID)
	if err != nil {
		return false, &errors.InternalServerError{Message: err.Error()}
	}
	if pinHash == "" {
		return false, &errors.BadRequestError{Message: "PIN belum diset"}
	}
	return bcrypt.VerifyPassword(pin, pinHash), nil
}

func (s *pinService) ChangePin(userID int, oldPin, newPin string) error {
	valid, err := s.VerifyPin(userID, oldPin)
	if err != nil {
		return err
	}
	if !valid {
		return &errors.UnauthenticatedError{Message: "PIN lama tidak sesuai"}
	}
	hashed, err := bcrypt.HashPassword(newPin)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if err := s.repo.SetPinHash(userID, hashed); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}
