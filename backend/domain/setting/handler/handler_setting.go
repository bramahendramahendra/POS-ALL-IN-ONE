package handler_setting

import (
	global_dto "permen_api/dto"
	dto_setting "permen_api/domain/setting/dto"
	service_setting "permen_api/domain/setting/service"
	"permen_api/helper"
	response_helper "permen_api/helper/response"

	"github.com/gin-gonic/gin"
)

type SettingHandler struct {
	service service_setting.SettingService
}

func NewSettingHandler(service service_setting.SettingService) *SettingHandler {
	return &SettingHandler{service: service}
}

// GET /api/settings
func (h *SettingHandler) GetAll(c *gin.Context) {
	data, err := h.service.GetAll()
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Success",
		Data:    data,
	})
}

// GET /api/settings/:key
func (h *SettingHandler) GetByKey(c *gin.Context) {
	key := c.Param("key")
	value, err := h.service.GetByKey(key)
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Success",
		Data:    dto_setting.SettingKeyValueResponse{Key: key, Value: value},
	})
}

// POST /api/settings
func (h *SettingHandler) Save(c *gin.Context) {
	var body map[string]string
	if err := c.ShouldBindJSON(&body); err != nil {
		c.Error(err)
		return
	}
	if err := h.service.Save(body); err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Settings berhasil disimpan",
	})
}

// POST /api/settings/reset
func (h *SettingHandler) Reset(c *gin.Context) {
	if err := h.service.Reset(); err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Settings berhasil direset ke default",
	})
}
