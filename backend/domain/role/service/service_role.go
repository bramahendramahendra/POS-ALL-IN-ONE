package service_role

import (
	dto_role "pos_api/domain/role/dto"
	model_role "pos_api/domain/role/model"
	repo_role "pos_api/domain/role/repo"
	"pos_api/errors"
)

type roleService struct {
	repo repo_role.RoleRepo
}

func NewRoleService(repo repo_role.RoleRepo) RoleService {
	return &roleService{repo: repo}
}

func (s *roleService) GetAll(filter *dto_role.RoleListFilter) ([]*dto_role.RoleResponse, error) {
	roles, err := s.repo.GetAll(filter)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	result := make([]*dto_role.RoleResponse, 0, len(roles))
	for _, r := range roles {
		result = append(result, toRoleResponse(r))
	}
	return result, nil
}

func (s *roleService) GetByID(id int) (*dto_role.RoleResponse, error) {
	r, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if r == nil {
		return nil, &errors.NotFoundError{Message: "Role tidak ditemukan"}
	}
	return toRoleResponse(r), nil
}

func (s *roleService) Create(req *dto_role.CreateRoleRequest) (*dto_role.RoleResponse, error) {
	existing, err := s.repo.GetByName(req.Name)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if existing != nil {
		return nil, &errors.BadRequestError{Message: "Nama role sudah digunakan"}
	}

	newID, err := s.repo.Create(req)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	created, err := s.repo.GetByID(int(newID))
	if err != nil || created == nil {
		return nil, &errors.InternalServerError{Message: "Gagal mengambil data role baru"}
	}
	return toRoleResponse(created), nil
}

func (s *roleService) Update(id int, req *dto_role.UpdateRoleRequest) error {
	r, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if r == nil {
		return &errors.NotFoundError{Message: "Role tidak ditemukan"}
	}

	if err := s.repo.Update(id, req); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *roleService) Delete(id int) error {
	r, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if r == nil {
		return &errors.NotFoundError{Message: "Role tidak ditemukan"}
	}
	if r.IsSystem {
		return &errors.BadRequestError{Message: "Role sistem tidak dapat dihapus"}
	}

	if err := s.repo.Delete(id); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func (s *roleService) ToggleStatus(id int) error {
	r, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if r == nil {
		return &errors.NotFoundError{Message: "Role tidak ditemukan"}
	}
	if r.IsSystem {
		return &errors.BadRequestError{Message: "Status role sistem tidak dapat diubah"}
	}

	if err := s.repo.ToggleStatus(id); err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	return nil
}

func toRoleResponse(r *model_role.Role) *dto_role.RoleResponse {
	return &dto_role.RoleResponse{
		ID:          r.ID,
		Name:        r.Name,
		DisplayName: r.DisplayName,
		Description: r.Description,
		IsSystem:    r.IsSystem,
		IsActive:    r.IsActive,
		CreatedAt:   r.CreatedAt,
	}
}
