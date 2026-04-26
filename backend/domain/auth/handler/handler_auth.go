package handler_auth

import (
	"strings"

	dto_auth "permen_api/domain/auth/dto"
	service_auth "permen_api/domain/auth/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"
	"permen_api/validation"
	global_dto "permen_api/dto"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	service service_auth.AuthService
}

func NewAuthHandler(service service_auth.AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

// POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto_auth.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	ip := c.ClientIP()
	resp, err := h.service.Login(&req, ip)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Login berhasil",
		Data:    resp,
	})
}

// POST /api/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	token := extractBearerToken(c)
	if token == "" {
		c.Error(&errors.UnauthenticatedError{Message: "Token tidak ditemukan"})
		return
	}

	if err := h.service.Logout(token); err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Logout berhasil",
	})
}

// POST /api/auth/refresh
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req dto_auth.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	resp, err := h.service.RefreshToken(req.RefreshToken)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Token diperbarui",
		Data:    resp,
	})
}

// GET /api/auth/me
func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.Error(&errors.UnauthenticatedError{Message: "User tidak terautentikasi"})
		return
	}

	id, ok := userID.(int)
	if !ok {
		c.Error(&errors.UnauthenticatedError{Message: "User ID tidak valid"})
		return
	}

	userData, err := h.service.GetMe(id)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Data user",
		Data:    userData,
	})
}

func extractBearerToken(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return ""
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return ""
	}
	return parts[1]
}
