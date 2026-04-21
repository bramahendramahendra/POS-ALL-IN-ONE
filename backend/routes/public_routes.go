package routes

import (
	auth "permen_api/domain/auth/handler"
	segment_sample "permen_api/routes/segment"

	"github.com/gin-gonic/gin"
)

func publicRoutes(r *gin.RouterGroup) {
	authHand := auth.NewAuthHandler()
	segment_sample.SampleRoutes(r)
	segment_sample.SampleIntegrationRoutes(r)

	r.POST("/auth", authHand.AuthToken)

}
