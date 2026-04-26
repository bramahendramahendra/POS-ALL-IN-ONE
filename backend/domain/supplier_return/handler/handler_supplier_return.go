package handler_supplier_return

import (
	"strconv"

	global_dto "permen_api/dto"
	dto_supplier_return "permen_api/domain/supplier_return/dto"
	service_supplier_return "permen_api/domain/supplier_return/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"
	"permen_api/validation"

	"github.com/gin-gonic/gin"
)

type SupplierReturnHandler struct {
	service service_supplier_return.SupplierReturnService
}

func NewSupplierReturnHandler(service service_supplier_return.SupplierReturnService) *SupplierReturnHandler {
	return &SupplierReturnHandler{service: service}
}

func (h *SupplierReturnHandler) GetAll(c *gin.Context) {
	filter := &dto_supplier_return.SupplierReturnFilter{
		StartDate: c.Query("start_date"),
		EndDate:   c.Query("end_date"),
		Status:    c.Query("status"),
	}

	if sidStr := c.Query("supplier_id"); sidStr != "" {
		if sid, err := strconv.Atoi(sidStr); err == nil {
			filter.SupplierID = &sid
		}
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	filter.Page = page
	filter.Limit = limit

	items, total, err := h.service.GetAll(filter)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:   helper.StatusOk,
		Status: true,
		Message: "Daftar retur supplier",
		Data: gin.H{
			"items": items,
			"total": total,
			"page":  filter.Page,
			"limit": filter.Limit,
		},
	})
}

func (h *SupplierReturnHandler) GetByID(c *gin.Context) {
	id, err := parseReturnID(c)
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
		Message: "Detail retur supplier",
		Data:    item,
	})
}

func (h *SupplierReturnHandler) Create(c *gin.Context) {
	var req dto_supplier_return.CreateSupplierReturnRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	uid, _ := userID.(int)

	item, svcErr := h.service.Create(&req, uid)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 201, "json", &global_dto.ResponseParams{
		Code:    helper.StatusCreated,
		Status:  true,
		Message: "Retur supplier berhasil dibuat",
		Data:    item,
	})
}

func (h *SupplierReturnHandler) UpdateStatus(c *gin.Context) {
	id, err := parseReturnID(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_supplier_return.UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	uid, _ := userID.(int)

	if svcErr := h.service.UpdateStatus(id, &req, uid); svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Status retur supplier berhasil diperbarui",
	})
}

func (h *SupplierReturnHandler) Delete(c *gin.Context) {
	id, err := parseReturnID(c)
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
		Message: "Retur supplier berhasil dihapus",
	})
}

func parseReturnID(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID tidak valid"}
	}
	return id, nil
}
