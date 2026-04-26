package service_auth

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"permen_api/config"
	dto_auth "permen_api/domain/auth/dto"
	model_auth "permen_api/domain/auth/model"
	repo_auth "permen_api/domain/auth/repo"
	"permen_api/errors"
	time_helper "permen_api/helper/time"
	"permen_api/pkg/bcrypt"
	"permen_api/pkg/jwt"
)

type authService struct {
	repo repo_auth.AuthRepo
}

func NewAuthService(repo repo_auth.AuthRepo) AuthService {
	return &authService{repo: repo}
}

func (s *authService) Login(req *dto_auth.LoginRequest, ip string) (*dto_auth.LoginResponse, error) {
	user, err := s.repo.GetUserByUsername(req.Username)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if user == nil {
		return nil, &errors.UnauthenticatedError{Message: "Username atau password salah"}
	}
	if !user.IsActive {
		return nil, &errors.UnauthenticatedError{Message: "Akun tidak aktif"}
	}
	if !bcrypt.VerifyPassword(req.Password, user.Password) {
		return nil, &errors.UnauthenticatedError{Message: "Username atau password salah"}
	}

	expiresAt := time_helper.GetTimeNow().Add(time.Second * time.Duration(config.Cfg.TokenExpire))

	claims := map[string]any{
		"user_id":  user.ID,
		"username": user.Username,
		"role":     user.Role,
	}
	jwt.CreateClaims(claims)
	token, err := jwt.GenerateToken()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	refreshToken, err := generateRefreshToken()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	// single active session: hapus session lama
	if err := s.repo.DeleteSessionByUserID(user.ID); err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	session := &model_auth.Session{
		UserID:       user.ID,
		Token:        token,
		RefreshToken: refreshToken,
		DeviceInfo:   req.DeviceInfo,
		IPAddress:    ip,
		ExpiresAt:    expiresAt,
	}
	if err := s.repo.CreateSession(session); err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	return &dto_auth.LoginResponse{
		Token:        token,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt,
		User: dto_auth.UserData{
			ID:       user.ID,
			Username: user.Username,
			FullName: user.FullName,
			Role:     user.Role,
		},
	}, nil
}

func (s *authService) Logout(token string) error {
	if err := s.repo.DeleteSessionByToken(token); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *authService) RefreshToken(refreshToken string) (*dto_auth.RefreshResponse, error) {
	session, err := s.repo.GetSessionByRefreshToken(refreshToken)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if session == nil {
		return nil, &errors.UnauthenticatedError{Message: "Refresh token tidak valid"}
	}
	if time_helper.GetTimeNow().After(session.ExpiresAt) {
		return nil, &errors.UnauthenticatedError{Message: "Refresh token sudah expired"}
	}

	user, err := s.repo.GetUserByID(session.UserID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if user == nil || !user.IsActive {
		return nil, &errors.UnauthenticatedError{Message: "Akun tidak aktif"}
	}

	expiresAt := time_helper.GetTimeNow().Add(time.Second * time.Duration(config.Cfg.TokenExpire))

	claims := map[string]any{
		"user_id":  user.ID,
		"username": user.Username,
		"role":     user.Role,
	}
	jwt.CreateClaims(claims)
	newToken, err := jwt.GenerateToken()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	newRefreshToken, err := generateRefreshToken()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	if err := s.repo.DeleteSessionByUserID(user.ID); err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	newSession := &model_auth.Session{
		UserID:       user.ID,
		Token:        newToken,
		RefreshToken: newRefreshToken,
		DeviceInfo:   session.DeviceInfo,
		IPAddress:    "",
		ExpiresAt:    expiresAt,
	}
	if err := s.repo.CreateSession(newSession); err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	return &dto_auth.RefreshResponse{
		Token:        newToken,
		RefreshToken: newRefreshToken,
		ExpiresAt:    expiresAt,
	}, nil
}

func (s *authService) GetMe(userID int) (*dto_auth.UserData, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if user == nil {
		return nil, &errors.NotFoundError{Message: "User tidak ditemukan"}
	}
	return &dto_auth.UserData{
		ID:       user.ID,
		Username: user.Username,
		FullName: user.FullName,
		Role:     user.Role,
	}, nil
}

func (s *authService) ValidateToken(token string) (*model_auth.Session, error) {
	if _, err := jwt.VerifyToken(token); err != nil {
		return nil, err
	}

	session, err := s.repo.GetSessionByToken(token)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if session == nil {
		return nil, &errors.UnauthenticatedError{Message: "Token tidak valid atau sudah logout"}
	}
	if time_helper.GetTimeNow().After(session.ExpiresAt) {
		return nil, &errors.UnauthenticatedError{Message: "Token expired"}
	}

	return session, nil
}

func generateRefreshToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
