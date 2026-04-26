package repo_user

import (
	dto_user "permen_api/domain/user/dto"
	model_user "permen_api/domain/user/model"
)

type UserRepo interface {
	GetAll(filter *dto_user.UserListFilter) ([]*model_user.User, error)
	GetByID(id int) (*model_user.User, error)
	GetByUsername(username string, excludeID int) (*model_user.User, error)
	Create(user *model_user.User) (int64, error)
	Update(id int, req *dto_user.UpdateUserRequest) error
	UpdatePassword(id int, hashedPassword string) error
	Delete(id int) error
	ToggleStatus(id int) error
	DeleteSessionByUserID(userID int) error
}
