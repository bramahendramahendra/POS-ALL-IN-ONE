package repo_role

import (
	"strings"

	dto_role "pos_api/domain/role/dto"
	model_role "pos_api/domain/role/model"

	"gorm.io/gorm"
)

const (
	getRoleByIDQuery   = `SELECT id, name, display_name, description, is_system, is_active, created_at, updated_at FROM roles WHERE id = ? LIMIT 1`
	getRoleByNameQuery = `SELECT id, name, display_name, description, is_system, is_active, created_at, updated_at FROM roles WHERE name = ? LIMIT 1`
	createRoleQuery    = `INSERT INTO roles (name, display_name, description) VALUES (?, ?, ?)`
	updateRoleQuery    = `UPDATE roles SET display_name = ?, description = ?, updated_at = NOW() WHERE id = ?`
	deleteRoleQuery    = `DELETE FROM roles WHERE id = ?`
	toggleRoleQuery    = `UPDATE roles SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?`
)

type roleRepo struct {
	db *gorm.DB
}

func NewRoleRepo(db *gorm.DB) RoleRepo {
	return &roleRepo{db: db}
}

func (r *roleRepo) GetAll(filter *dto_role.RoleListFilter) ([]*model_role.Role, error) {
	query := `SELECT id, name, display_name, description, is_system, is_active, created_at, updated_at FROM roles WHERE 1=1`
	args := []any{}

	if filter.Search != "" {
		safe := "%" + strings.ReplaceAll(filter.Search, "%", `\%`) + "%"
		query += ` AND (name LIKE ? OR display_name LIKE ?)`
		args = append(args, safe, safe)
	}
	if filter.IsActive != nil {
		query += ` AND is_active = ?`
		args = append(args, *filter.IsActive)
	}

	query += ` ORDER BY is_system DESC, id ASC`

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []*model_role.Role
	for rows.Next() {
		var role model_role.Role
		if err := rows.Scan(&role.ID, &role.Name, &role.DisplayName, &role.Description,
			&role.IsSystem, &role.IsActive, &role.CreatedAt, &role.UpdatedAt); err != nil {
			return nil, err
		}
		roles = append(roles, &role)
	}
	return roles, nil
}

func (r *roleRepo) GetByID(id int) (*model_role.Role, error) {
	var role model_role.Role
	result := r.db.Raw(getRoleByIDQuery, id).Scan(&role)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &role, nil
}

func (r *roleRepo) GetByName(name string) (*model_role.Role, error) {
	var role model_role.Role
	result := r.db.Raw(getRoleByNameQuery, name).Scan(&role)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &role, nil
}

func (r *roleRepo) Create(req *dto_role.CreateRoleRequest) (int64, error) {
	var desc *string
	if req.Description != "" {
		desc = &req.Description
	}

	res := r.db.Exec(createRoleQuery, req.Name, req.DisplayName, desc)
	if res.Error != nil {
		return 0, res.Error
	}

	var id int64
	if err := r.db.Raw(`SELECT LAST_INSERT_ID()`).Scan(&id).Error; err != nil {
		return 0, err
	}
	return id, nil
}

func (r *roleRepo) Update(id int, req *dto_role.UpdateRoleRequest) error {
	var desc *string
	if req.Description != "" {
		desc = &req.Description
	}
	return r.db.Exec(updateRoleQuery, req.DisplayName, desc, id).Error
}

func (r *roleRepo) Delete(id int) error {
	return r.db.Exec(deleteRoleQuery, id).Error
}

func (r *roleRepo) ToggleStatus(id int) error {
	return r.db.Exec(toggleRoleQuery, id).Error
}
