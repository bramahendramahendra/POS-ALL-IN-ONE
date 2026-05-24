package service_access

import dto_access "pos_api/domain/access/dto"

type AccessService interface {
	GetByRoleID(roleID int) ([]*dto_access.RoleMenuAccessItem, error)
	SetRoleAccess(roleID int, req *dto_access.SetRoleAccessRequest) error
}
