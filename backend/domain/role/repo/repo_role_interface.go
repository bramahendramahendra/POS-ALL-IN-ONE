package repo_role

import (
	dto_role "pos_api/domain/role/dto"
	model_role "pos_api/domain/role/model"
)

type RoleRepo interface {
	GetAll(filter *dto_role.RoleListFilter) ([]*model_role.Role, error)
	GetByID(id int) (*model_role.Role, error)
	GetByName(name string) (*model_role.Role, error)
	Create(req *dto_role.CreateRoleRequest) (int64, error)
	Update(id int, req *dto_role.UpdateRoleRequest) error
	Delete(id int) error
	ToggleStatus(id int) error
}
