package handler_product_unit

import (
	"strconv"

	dto_product_unit "pos_api/domain/product_unit/dto"
	service_product_unit "pos_api/domain/product_unit/service"
	global_dto "pos_api/dto"
	"pos_api/errors"
	"pos_api/helper"
	response_helper "pos_api/helper/response"
	"pos_api/validation"

	"github.com/gin-gonic/gin"
)

type UnitHandler struct {
	service service_product_unit.UnitService
}

func NewUnitHandler(service service_product_unit.UnitService) *UnitHandler {
	return &UnitHandler{service: service}
}

// GET /api/units
func (h *UnitHandler) GetAll(c *gin.Context) {
	units, err := h.service.GetAll()
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar satuan",
		Data:    units,
	})
}

// GET /api/units/active
func (h *UnitHandler) GetActive(c *gin.Context) {
	units, err := h.service.GetActive()
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar satuan aktif",
		Data:    units,
	})
}

// GET /api/units/:id
func (h *UnitHandler) GetByID(c *gin.Context) {
	id, err := parseIDParam(c)
	if err != nil {
		c.Error(err)
		return
	}

	unit, svcErr := h.service.GetByID(id)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Detail satuan",
		Data:    unit,
	})
}

// POST /api/units
func (h *UnitHandler) Create(c *gin.Context) {
	var req dto_product_unit.CreateUnitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	unit, err := h.service.Create(&req)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 201, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Satuan berhasil dibuat",
		Data:    unit,
	})
}

// PUT /api/units/:id
func (h *UnitHandler) Update(c *gin.Context) {
	id, err := parseIDParam(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_product_unit.UpdateUnitRequest
	if bindErr := c.ShouldBindJSON(&req); bindErr != nil {
		c.Error(&errors.BadRequestError{Message: bindErr.Error()})
		return
	}
	if valErr := validation.Validate.Struct(req); valErr != nil {
		c.Error(&errors.BadRequestError{Message: valErr.Error()})
		return
	}

	if svcErr := h.service.Update(id, &req); svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Satuan berhasil diperbarui",
	})
}

// DELETE /api/units/:id
func (h *UnitHandler) Delete(c *gin.Context) {
	id, err := parseIDParam(c)
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
		Message: "Satuan berhasil dihapus",
	})
}

// PATCH /api/units/:id/toggle-status
func (h *UnitHandler) ToggleStatus(c *gin.Context) {
	id, err := parseIDParam(c)
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
		Message: "Status satuan berhasil diubah",
	})
}

func parseIDParam(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID tidak valid"}
	}
	return id, nil
}
