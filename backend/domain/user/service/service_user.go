package service_user

import (
	dto_user "permen_api/domain/user/dto"
	model_user "permen_api/domain/user/model"
	repo_user "permen_api/domain/user/repo"
	"permen_api/errors"
	"permen_api/pkg/bcrypt"
)

type userService struct {
	repo repo_user.UserRepo
}

func NewUserService(repo repo_user.UserRepo) UserService {
	return &userService{repo: repo}
}

func (s *userService) GetAll(filter *dto_user.UserListFilter) ([]*dto_user.UserResponse, error) {
	users, err := s.repo.GetAll(filter)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	result := make([]*dto_user.UserResponse, 0, len(users))
	for _, u := range users {
		result = append(result, toUserResponse(u))
	}
	return result, nil
}

func (s *userService) GetByID(id int) (*dto_user.UserResponse, error) {
	u, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if u == nil {
		return nil, &errors.NotFoundError{Message: "User tidak ditemukan"}
	}
	return toUserResponse(u), nil
}

func (s *userService) Create(req *dto_user.CreateUserRequest) (*dto_user.UserResponse, error) {
	existing, err := s.repo.GetByUsername(req.Username, 0)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if existing != nil {
		return nil, &errors.BadRequestError{Message: "Username sudah digunakan"}
	}

	hashed, err := bcrypt.HashPassword(req.Password)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	user := &model_user.User{
		Username: req.Username,
		Password: hashed,
		FullName: req.FullName,
		Role:     req.Role,
	}

	newID, err := s.repo.Create(user)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	created, err := s.repo.GetByID(int(newID))
	if err != nil || created == nil {
		return nil, &errors.InternalServerError{Message: "Gagal mengambil data user baru"}
	}
	return toUserResponse(created), nil
}

func (s *userService) Update(id int, req *dto_user.UpdateUserRequest) error {
	u, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if u == nil {
		return &errors.NotFoundError{Message: "User tidak ditemukan"}
	}

	if err := s.repo.Update(id, req); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}

	if req.Password != "" {
		hashed, err := bcrypt.HashPassword(req.Password)
		if err != nil {
			return &errors.InternalServerError{Message: err.Error()}
		}
		if err := s.repo.UpdatePassword(id, hashed); err != nil {
			return &errors.InternalServerError{Message: err.Error()}
		}
	}
	return nil
}

func (s *userService) Delete(id, currentUserID int) error {
	if id == currentUserID {
		return &errors.BadRequestError{Message: "Tidak bisa menghapus akun sendiri"}
	}

	u, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if u == nil {
		return &errors.NotFoundError{Message: "User tidak ditemukan"}
	}

	// force logout user yang dihapus
	if err := s.repo.DeleteSessionByUserID(id); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}

	if err := s.repo.Delete(id); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *userService) ToggleStatus(id int) error {
	u, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if u == nil {
		return &errors.NotFoundError{Message: "User tidak ditemukan"}
	}
	if err := s.repo.ToggleStatus(id); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func toUserResponse(u *model_user.User) *dto_user.UserResponse {
	return &dto_user.UserResponse{
		ID:        u.ID,
		Username:  u.Username,
		FullName:  u.FullName,
		Role:      u.Role,
		IsActive:  u.IsActive,
		CreatedAt: u.CreatedAt,
	}
}
