package service_user

import dto_user "permen_api/domain/user/dto"

type UserService interface {
	GetAll(filter *dto_user.UserListFilter) ([]*dto_user.UserResponse, error)
	GetByID(id int) (*dto_user.UserResponse, error)
	Create(req *dto_user.CreateUserRequest) (*dto_user.UserResponse, error)
	Update(id int, req *dto_user.UpdateUserRequest) error
	Delete(id, currentUserID int) error
	ToggleStatus(id int) error
}
