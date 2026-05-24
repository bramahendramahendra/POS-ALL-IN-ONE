package service_role

import dto_role "pos_api/domain/role/dto"

type RoleService interface {
	GetAll(filter *dto_role.RoleListFilter) ([]*dto_role.RoleResponse, error)
	GetByID(id int) (*dto_role.RoleResponse, error)
	Create(req *dto_role.CreateRoleRequest) (*dto_role.RoleResponse, error)
	Update(id int, req *dto_role.UpdateRoleRequest) error
	Delete(id int) error
	ToggleStatus(id int) error
}
