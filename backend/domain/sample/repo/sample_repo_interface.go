package repo

import (
	dto "permen_api/domain/sample/dto"
	model "permen_api/domain/sample/model"

	"gorm.io/gorm"
)

type (
	UserIntegrationRepoInterface interface {
		CreateUserIntegration(req *dto.CreateUserIntegrationRequest) error
		GetUserIntegrationByUsername(username string) (*model.UserIntegration, error)
		GetAllUserIntegrations() ([]*model.UserIntegration, error)
		GetDB() *gorm.DB
	}

	userIntegrationRepo struct {
		db *gorm.DB
	}
)

func NewUserIntegrationRepo(db *gorm.DB) *userIntegrationRepo {
	return &userIntegrationRepo{db: db}
}

func (r *userIntegrationRepo) GetDB() *gorm.DB {
	return r.db
}
