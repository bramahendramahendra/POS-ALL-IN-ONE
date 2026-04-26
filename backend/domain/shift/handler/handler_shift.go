package handler_shift

import (
	"strconv"

	global_dto "permen_api/dto"
	dto_shift "permen_api/domain/shift/dto"
	service_shift "permen_api/domain/shift/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"
	"permen_api/validation"

	"github.com/gin-gonic/gin"
)

type ShiftHandler struct {
	service service_shift.ShiftService
}

func NewShiftHandler(service service_shift.ShiftService) *ShiftHandler {
	return &ShiftHandler{service: service}
}

// GET /api/shifts
func (h *ShiftHandler) GetAll(c *gin.Context) {
	items, err := h.service.GetAll()
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar shift",
		Data:    items,
	})
}

// GET /api/shifts/active
func (h *ShiftHandler) GetActive(c *gin.Context) {
	items, err := h.service.GetActive()
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar shift aktif",
		Data:    items,
	})
}

// GET /api/shifts/summary
func (h *ShiftHandler) GetSummary(c *gin.Context) {
	items, err := h.service.GetSummary()
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Ringkasan shift",
		Data:    items,
	})
}

// GET /api/shifts/:id
func (h *ShiftHandler) GetByID(c *gin.Context) {
	id, err := parseShiftID(c)
	if err != nil {
		c.Error(err)
		return
	}
	item, svcErr := h.service.GetByID(id)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Detail shift",
		Data:    item,
	})
}

// POST /api/shifts
func (h *ShiftHandler) Create(c *gin.Context) {
	var req dto_shift.ShiftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	item, svcErr := h.service.Create(&req)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}
	response_helper.WrapResponse(c, 201, "json", &global_dto.ResponseParams{
		Code:    helper.StatusCreated,
		Status:  true,
		Message: "Shift berhasil dibuat",
		Data:    item,
	})
}

// PUT /api/shifts/:id
func (h *ShiftHandler) Update(c *gin.Context) {
	id, err := parseShiftID(c)
	if err != nil {
		c.Error(err)
		return
	}
	var req dto_shift.ShiftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if svcErr := h.service.Update(id, &req); svcErr != nil {
		c.Error(svcErr)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Shift berhasil diperbarui",
	})
}

// DELETE /api/shifts/:id
func (h *ShiftHandler) Delete(c *gin.Context) {
	id, err := parseShiftID(c)
	if err != nil {
		c.Error(err)
		return
	}
	if svcErr := h.service.Delete(id); svcErr != nil {
		c.Error(svcErr)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Shift berhasil dihapus",
	})
}

// PATCH /api/shifts/:id/toggle-status
func (h *ShiftHandler) ToggleStatus(c *gin.Context) {
	id, err := parseShiftID(c)
	if err != nil {
		c.Error(err)
		return
	}
	if svcErr := h.service.ToggleStatus(id); svcErr != nil {
		c.Error(svcErr)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Status shift berhasil diubah",
	})
}

func parseShiftID(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID tidak valid"}
	}
	return id, nil
}
