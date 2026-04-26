package handler_pin

import (
	global_dto "permen_api/dto"
	dto_pin "permen_api/domain/pin/dto"
	service_pin "permen_api/domain/pin/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"
	"permen_api/validation"

	"github.com/gin-gonic/gin"
)

type PinHandler struct {
	service service_pin.PinService
}

func NewPinHandler(service service_pin.PinService) *PinHandler {
	return &PinHandler{service: service}
}

// GET /api/pin/check
func (h *PinHandler) CheckPin(c *gin.Context) {
	userID := helper.GetUserID(c)

	hasPin, err := h.service.HasPin(userID)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Status PIN",
		Data:    &dto_pin.HasPinResponse{HasPin: hasPin},
	})
}

// POST /api/pin/set
func (h *PinHandler) SetPin(c *gin.Context) {
	var req dto_pin.SetPinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	userID := helper.GetUserID(c)
	if err := h.service.SetPin(userID, req.Pin); err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "PIN berhasil diset",
	})
}

// POST /api/pin/verify
func (h *PinHandler) VerifyPin(c *gin.Context) {
	var req dto_pin.VerifyPinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	userID := helper.GetUserID(c)
	valid, err := h.service.VerifyPin(userID, req.Pin)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Verifikasi PIN",
		Data:    &dto_pin.VerifyPinResponse{Valid: valid},
	})
}

// POST /api/pin/change
func (h *PinHandler) ChangePin(c *gin.Context) {
	var req dto_pin.ChangePinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	userID := helper.GetUserID(c)
	if err := h.service.ChangePin(userID, req.OldPin, req.NewPin); err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "PIN berhasil diubah",
	})
}
