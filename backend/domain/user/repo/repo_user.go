package repo_user

import (
	"fmt"
	"strings"

	dto_user "pos_api/domain/user/dto"
	model_user "pos_api/domain/user/model"

	"gorm.io/gorm"
)

const (
	getUserByIDQuery       = `SELECT u.id, u.username, u.full_name, u.role_id, r.name AS role_name, u.is_active, u.created_at, u.updated_at FROM users u INNER JOIN roles r ON r.id = u.role_id WHERE u.id = ? LIMIT 1`
	getUserByUsernameQuery = `SELECT u.id FROM users u WHERE u.username = ? AND u.id != ? LIMIT 1`
	createUserQuery        = `INSERT INTO users (username, password, full_name, role_id) VALUES (?, ?, ?, ?)`
	updateUserQuery        = `UPDATE users SET full_name = ?, role_id = ?, updated_at = NOW() WHERE id = ?`
	updatePasswordQuery    = `UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?`
	deleteUserQuery        = `DELETE FROM users WHERE id = ?`
	toggleUserStatusQuery  = `UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?`
	deleteSessionQuery     = `DELETE FROM sessions WHERE user_id = ?`
)

type userRepo struct {
	db *gorm.DB
}

func NewUserRepo(db *gorm.DB) UserRepo {
	return &userRepo{db: db}
}

func (r *userRepo) GetAll(filter *dto_user.UserListFilter) ([]*model_user.User, error) {
	query := `SELECT u.id, u.username, u.full_name, u.role_id, r.name AS role_name, u.is_active, u.created_at, u.updated_at FROM users u INNER JOIN roles r ON r.id = u.role_id WHERE 1=1`
	args := []any{}

	if filter.Search != "" {
		safe := "%" + strings.ReplaceAll(filter.Search, "%", `\%`) + "%"
		query += ` AND (u.username LIKE ? OR u.full_name LIKE ?)`
		args = append(args, safe, safe)
	}
	if filter.RoleID != nil {
		query += ` AND u.role_id = ?`
		args = append(args, *filter.RoleID)
	}
	if filter.IsActive != nil {
		query += ` AND u.is_active = ?`
		args = append(args, *filter.IsActive)
	}

	query += ` ORDER BY u.id ASC`

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*model_user.User
	for rows.Next() {
		var u model_user.User
		if err := rows.Scan(&u.ID, &u.Username, &u.FullName, &u.RoleID, &u.RoleName,
			&u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, &u)
	}
	return users, nil
}

func (r *userRepo) GetByID(id int) (*model_user.User, error) {
	rows, err := r.db.Raw(getUserByIDQuery, id).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, nil
	}
	var u model_user.User
	if err := rows.Scan(&u.ID, &u.Username, &u.FullName, &u.RoleID, &u.RoleName,
		&u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepo) GetByUsername(username string, excludeID int) (*model_user.User, error) {
	var u model_user.User
	result := r.db.Raw(getUserByUsernameQuery, username, excludeID).Scan(&u)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &u, nil
}

func (r *userRepo) Create(user *model_user.User) (int64, error) {
	res := r.db.Exec(createUserQuery, user.Username, user.Password, user.FullName, user.RoleID)
	if res.Error != nil {
		return 0, res.Error
	}
	var id int64
	if err := r.db.Raw(`SELECT LAST_INSERT_ID()`).Scan(&id).Error; err != nil {
		return 0, fmt.Errorf("failed to get last insert id: %w", err)
	}
	return id, nil
}

func (r *userRepo) Update(id int, req *dto_user.UpdateUserRequest) error {
	return r.db.Exec(updateUserQuery, req.FullName, req.RoleID, id).Error
}

func (r *userRepo) UpdatePassword(id int, hashedPassword string) error {
	return r.db.Exec(updatePasswordQuery, hashedPassword, id).Error
}

func (r *userRepo) Delete(id int) error {
	return r.db.Exec(deleteUserQuery, id).Error
}

func (r *userRepo) ToggleStatus(id int) error {
	return r.db.Exec(toggleUserStatusQuery, id).Error
}

func (r *userRepo) DeleteSessionByUserID(userID int) error {
	return r.db.Exec(deleteSessionQuery, userID).Error
}
