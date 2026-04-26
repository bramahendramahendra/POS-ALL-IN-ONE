package service_auth

import (
	dto_auth "permen_api/domain/auth/dto"
	model_auth "permen_api/domain/auth/model"
)

type AuthService interface {
	Login(req *dto_auth.LoginRequest, ip string) (*dto_auth.LoginResponse, error)
	Logout(token string) error
	RefreshToken(refreshToken string) (*dto_auth.RefreshResponse, error)
	GetMe(userID int) (*dto_auth.UserData, error)
	ValidateToken(token string) (*model_auth.Session, error)
}
