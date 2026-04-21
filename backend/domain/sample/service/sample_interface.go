package service

import (
	dto "permen_api/domain/sample/dto"
	repo "permen_api/domain/sample/repo"
	globalDTO "permen_api/dto"
	transport "permen_api/pkg/transport"

	"github.com/gin-gonic/gin"
)

type (
	UserIntegrationServiceInterface interface {
		CreateUserIntegration(req *dto.CreateUserIntegrationRequest) (data dto.CreateUserIntegrationResponse, err error)
		GetUserIntegrationByUsername(username string) (data dto.UserIntegrationResponse, err error)
		GetAllUserIntegrations() (data []dto.UserIntegrationResponse, err error)
		InquiryAccountCASAVA(c *gin.Context, accountNumber string) (data globalDTO.InquryCASAVAResponse, err error)
	}

	userIntegrationService struct {
		repo repo.UserIntegrationRepoInterface
		esb  *transport.RestClient
	}
)

func NewUserIntegrationService(repo repo.UserIntegrationRepoInterface, esb *transport.RestClient) *userIntegrationService {
	return &userIntegrationService{repo: repo, esb: esb}
}
