package repo

import (
	dto "permen_api/domain/sample/dto"
	model "permen_api/domain/sample/model"
)

const (
	CreateUserIntegrationQuery        = `INSERT INTO user_integration (username, credentials, created_by, channel_name,  is_active, created_at, updated_at) VALUES (?, ?, 'SYSTEM', ?, 1, NOW(), NOW())`
	GetUserIntegrationByUsernameQuery = `SELECT username, credentials, created_by, channel_name, is_active, created_at, updated_at FROM user_integration WHERE username = ?`
	GetAllUserIntegrationsQuery       = `SELECT username, credentials, created_by, channel_name, is_active, created_at, updated_at FROM user_integration`
)

func (r *userIntegrationRepo) CreateUserIntegration(req *dto.CreateUserIntegrationRequest) error {
	return r.db.Exec(CreateUserIntegrationQuery, req.Username, req.Creds, req.Username).Error
}

func (r *userIntegrationRepo) GetUserIntegrationByUsername(username string) (*model.UserIntegration, error) {
	var userIntegration model.UserIntegration
	err := r.db.Raw(GetUserIntegrationByUsernameQuery, username).Scan(&userIntegration).Error
	if err != nil {
		return nil, err
	}
	return &userIntegration, nil
}

func (r *userIntegrationRepo) GetAllUserIntegrations() ([]*model.UserIntegration, error) {
	var userIntegrations []*model.UserIntegration
	err := r.db.Raw(GetAllUserIntegrationsQuery).Scan(&userIntegrations).Error
	if err != nil {
		return nil, err
	}
	return userIntegrations, nil
}
