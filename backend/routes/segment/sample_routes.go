package segment

import (
	handler "permen_api/domain/sample/handler"
	repo "permen_api/domain/sample/repo"
	service "permen_api/domain/sample/service"
	db "permen_api/pkg/database"
	transport "permen_api/pkg/transport"

	"github.com/gin-gonic/gin"
)

func SampleRoutes(r *gin.RouterGroup) {
	sampleRepo := repo.NewUserIntegrationRepo(db.DB)
	sampleService := service.NewUserIntegrationService(sampleRepo, transport.EsbRestClient)
	sampleHandler := handler.NewSampleHandler(sampleService)

	userIntegrationGroup := r.Group("user-integration")
	userIntegrationGroup.POST("/create", sampleHandler.CreateUserIntegration)
	userIntegrationGroup.POST("/get/:username", sampleHandler.GetUserIntegrationByUsername)
	userIntegrationGroup.POST("/get-all", sampleHandler.GetAllUserIntegrations)
}

func SampleIntegrationRoutes(r *gin.RouterGroup) {
	sampleRepo := repo.NewUserIntegrationRepo(db.DB)
	sampleService := service.NewUserIntegrationService(sampleRepo, transport.EsbRestClient)
	sampleHandler := handler.NewSampleHandler(sampleService)

	integrationGroup := r.Group("integration")
	integrationGroup.POST("/inquiry-casava", sampleHandler.InquiryCASAVA)
}
