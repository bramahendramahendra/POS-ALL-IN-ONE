package handler_auth

import (
	dto_auth "permen_api/domain/auth/dto"
	global_dto "permen_api/dto"
	"permen_api/helper"
	response_helper "permen_api/helper/response"
	"permen_api/pkg/jwt"
	"permen_api/validation"

	// error_helper "permen_api/helper/error"
	"permen_api/errors"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

func (a *AuthHandler) AuthToken(c *gin.Context) {
	type req struct {
		Pernr  string `json:"pernr" validate:"required,numeric"`
		Nama   string `json:"nama" validate:"required,ascii"`
		Branch string `json:"branchCode" validate:"required,numeric"`
		Orgeh  string `json:"organisasiUnit" validate:"required,numeric"`
		Hilfm  string `json:"hilfm" validate:"required,numeric"`
		Kostl  string `json:"costCenter" validate:"required,alphanum"`
	}

	var reqData req

	if err := c.ShouldBindJSON(&reqData); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	if err := validation.Validate.Struct(reqData); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})

		return
	}

	claims := map[string]any{
		"pernr":          reqData.Pernr,
		"nama":           reqData.Nama,
		"branchCode":     reqData.Branch,
		"organisasiUnit": reqData.Orgeh,
		"hilfm":          reqData.Hilfm,
		"costCenter":     reqData.Kostl,
	}

	jwt.CreateClaims(claims)
	token, err := jwt.GenerateToken()
	if err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Succes Generate Token",
		Data: dto_auth.AuthRes{
			Token: token,
		},
	})
}
