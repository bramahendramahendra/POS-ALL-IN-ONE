package service_access

import (
	dto_access "pos_api/domain/access/dto"
	repo_access "pos_api/domain/access/repo"
	repo_role "pos_api/domain/role/repo"
	"pos_api/errors"
)

type accessService struct {
	repo     repo_access.AccessRepo
	roleRepo repo_role.RoleRepo
}

func NewAccessService(repo repo_access.AccessRepo, roleRepo repo_role.RoleRepo) AccessService {
	return &accessService{repo: repo, roleRepo: roleRepo}
}

func (s *accessService) GetByRoleID(roleID int) ([]*dto_access.RoleMenuAccessItem, error) {
	role, err := s.roleRepo.GetByID(roleID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if role == nil {
		return nil, &errors.NotFoundError{Message: "Role tidak ditemukan"}
	}

	items, err := s.repo.GetByRoleID(roleID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return items, nil
}

func (s *accessService) SetRoleAccess(roleID int, req *dto_access.SetRoleAccessRequest) error {
	role, err := s.roleRepo.GetByID(roleID)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if role == nil {
		return &errors.NotFoundError{Message: "Role tidak ditemukan"}
	}

	if err := s.repo.SetRoleAccess(roleID, req.Accesses); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}
