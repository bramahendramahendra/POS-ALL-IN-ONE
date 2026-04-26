package repo_user

import (
	"fmt"
	"strings"

	dto_user "permen_api/domain/user/dto"
	model_user "permen_api/domain/user/model"

	"gorm.io/gorm"
)

const (
	getUserByIDQuery       = `SELECT id, username, full_name, role, is_active, created_at, updated_at FROM users WHERE id = ? LIMIT 1`
	getUserByUsernameQuery = `SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1`
	createUserQuery        = `INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)`
	updateUserQuery        = `UPDATE users SET full_name = ?, role = ?, updated_at = NOW() WHERE id = ?`
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
	query := `SELECT id, username, full_name, role, is_active, created_at, updated_at FROM users WHERE 1=1`
	args := []any{}

	if filter.Search != "" {
		safe := "%" + strings.ReplaceAll(filter.Search, "%", `\%`) + "%"
		query += ` AND (username LIKE ? OR full_name LIKE ?)`
		args = append(args, safe, safe)
	}
	if filter.Role != "" {
		query += ` AND role = ?`
		args = append(args, filter.Role)
	}
	if filter.IsActive != nil {
		query += ` AND is_active = ?`
		args = append(args, *filter.IsActive)
	}

	query += ` ORDER BY id ASC`

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*model_user.User
	for rows.Next() {
		var u model_user.User
		if err := rows.Scan(&u.ID, &u.Username, &u.FullName, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, &u)
	}
	return users, nil
}

func (r *userRepo) GetByID(id int) (*model_user.User, error) {
	var u model_user.User
	result := r.db.Raw(getUserByIDQuery, id).Scan(&u)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
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
	res := r.db.Exec(createUserQuery, user.Username, user.Password, user.FullName, user.Role)
	if res.Error != nil {
		return 0, res.Error
	}
	// Retrieve last inserted ID
	var id int64
	if err := r.db.Raw(`SELECT LAST_INSERT_ID()`).Scan(&id).Error; err != nil {
		return 0, fmt.Errorf("failed to get last insert id: %w", err)
	}
	return id, nil
}

func (r *userRepo) Update(id int, req *dto_user.UpdateUserRequest) error {
	return r.db.Exec(updateUserQuery, req.FullName, req.Role, id).Error
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
