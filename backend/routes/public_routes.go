package routes

import (
	auth "permen_api/domain/auth/handler"

	"github.com/gin-gonic/gin"
)

func publicRoutes(r *gin.RouterGroup) {
	authHand := auth.NewAuthHandler()

	r.POST("/auth", authHand.AuthToken)
}
