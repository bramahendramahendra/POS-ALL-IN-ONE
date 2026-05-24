package repo_access

import dto_access "pos_api/domain/access/dto"

type AccessRepo interface {
	GetByRoleID(roleID int) ([]*dto_access.RoleMenuAccessItem, error)
	SetRoleAccess(roleID int, accesses []dto_access.SetAccessItem) error
}
