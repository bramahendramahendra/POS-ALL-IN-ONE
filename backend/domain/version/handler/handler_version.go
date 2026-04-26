package handler_version

import (
	global_dto "permen_api/dto"
	dto_version "permen_api/domain/version/dto"
	service_version "permen_api/domain/version/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"

	"github.com/gin-gonic/gin"
)

type VersionHandler struct {
	service service_version.VersionService
}

func NewVersionHandler(service service_version.VersionService) *VersionHandler {
	return &VersionHandler{service: service}
}

// GET /api/version/android
func (h *VersionHandler) CheckAndroid(c *gin.Context) {
	currentVersion := c.Query("current_version")
	if currentVersion == "" {
		c.Error(&errors.BadRequestError{Message: "current_version wajib diisi"})
		return
	}

	result, err := h.service.CheckAndroid(currentVersion)
	if err != nil {
		c.Error(err)
		return
	}

	msg := "Aplikasi sudah versi terbaru"
	if result.HasUpdate {
		msg = "Versi baru tersedia"
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: msg,
		Data:    result,
	})
}

// POST /api/version/android
func (h *VersionHandler) UpdateAndroidVersion(c *gin.Context) {
	var req dto_version.UpdateVersionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	if err := h.service.UpdateAndroidVersion(&req); err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 201, "json", &global_dto.ResponseParams{
		Code:    helper.StatusCreated,
		Status:  true,
		Message: "Versi berhasil diupdate",
	})
}
