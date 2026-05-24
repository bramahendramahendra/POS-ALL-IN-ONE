package repo_auth

import (
	model_auth "pos_api/domain/auth/model"

	"gorm.io/gorm"
)

const (
	getUserByUsernameQuery        = `SELECT u.id, u.username, u.password, u.full_name, u.role_id, r.name AS role_name, u.is_active FROM users u INNER JOIN roles r ON r.id = u.role_id WHERE u.username = ? LIMIT 1`
	getUserByIDQuery              = `SELECT u.id, u.username, u.full_name, u.role_id, r.name AS role_name, u.is_active FROM users u INNER JOIN roles r ON r.id = u.role_id WHERE u.id = ? LIMIT 1`
	createSessionQuery            = `INSERT INTO sessions (user_id, user_role, token, refresh_token, device_info, ip_address, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE user_role=VALUES(user_role), token=VALUES(token), refresh_token=VALUES(refresh_token), device_info=VALUES(device_info), ip_address=VALUES(ip_address), expires_at=VALUES(expires_at), created_at=NOW()`
	getSessionByTokenQuery        = `SELECT id, user_id, user_role, token, device_info, expires_at FROM sessions WHERE token = ? LIMIT 1`
	getSessionByRefreshTokenQuery = `SELECT id, user_id, refresh_token, expires_at FROM sessions WHERE refresh_token = ? LIMIT 1`
	deleteSessionByUserIDQuery    = `DELETE FROM sessions WHERE user_id = ?`
	deleteSessionByTokenQuery     = `DELETE FROM sessions WHERE token = ?`
)

type authRepo struct {
	db *gorm.DB
}

func NewAuthRepo(db *gorm.DB) AuthRepo {
	return &authRepo{db: db}
}

func (r *authRepo) GetUserByUsername(username string) (*model_auth.User, error) {
	rows, err := r.db.Raw(getUserByUsernameQuery, username).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, nil
	}
	var user model_auth.User
	if err := rows.Scan(&user.ID, &user.Username, &user.Password, &user.FullName,
		&user.RoleID, &user.RoleName, &user.IsActive); err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *authRepo) GetUserByID(id int) (*model_auth.User, error) {
	rows, err := r.db.Raw(getUserByIDQuery, id).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, nil
	}
	var user model_auth.User
	if err := rows.Scan(&user.ID, &user.Username, &user.FullName,
		&user.RoleID, &user.RoleName, &user.IsActive); err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *authRepo) CreateSession(session *model_auth.Session) error {
	return r.db.Exec(createSessionQuery,
		session.UserID,
		session.UserRole,
		session.Token,
		session.RefreshToken,
		session.DeviceInfo,
		session.IPAddress,
		session.ExpiresAt,
	).Error
}

func (r *authRepo) GetSessionByToken(token string) (*model_auth.Session, error) {
	var session model_auth.Session
	result := r.db.Raw(getSessionByTokenQuery, token).Scan(&session)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &session, nil
}

func (r *authRepo) GetSessionByRefreshToken(token string) (*model_auth.Session, error) {
	var session model_auth.Session
	result := r.db.Raw(getSessionByRefreshTokenQuery, token).Scan(&session)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &session, nil
}

func (r *authRepo) DeleteSessionByUserID(userID int) error {
	return r.db.Exec(deleteSessionByUserIDQuery, userID).Error
}

func (r *authRepo) DeleteSessionByToken(token string) error {
	return r.db.Exec(deleteSessionByTokenQuery, token).Error
}
