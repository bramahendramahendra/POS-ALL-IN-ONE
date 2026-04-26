package handler_supplier

import (
	"strconv"

	global_dto "permen_api/dto"
	dto_supplier "permen_api/domain/supplier/dto"
	service_supplier "permen_api/domain/supplier/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"
	"permen_api/validation"

	"github.com/gin-gonic/gin"
)

type SupplierHandler struct {
	service service_supplier.SupplierService
}

func NewSupplierHandler(service service_supplier.SupplierService) *SupplierHandler {
	return &SupplierHandler{service: service}
}

// GET /api/suppliers
func (h *SupplierHandler) GetAll(c *gin.Context) {
	filter := &dto_supplier.SupplierFilter{
		Search: c.Query("search"),
	}

	if isActiveStr := c.Query("is_active"); isActiveStr != "" {
		val := isActiveStr == "true" || isActiveStr == "1"
		filter.IsActive = &val
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
		Message: "Daftar supplier",
		Data: gin.H{
			"items": items,
			"total": total,
			"page":  filter.Page,
			"limit": filter.Limit,
		},
	})
}

// GET /api/suppliers/active
func (h *SupplierHandler) GetActiveList(c *gin.Context) {
	items, err := h.service.GetActiveList()
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar supplier aktif",
		Data:    items,
	})
}

// GET /api/suppliers/:id
func (h *SupplierHandler) GetDetail(c *gin.Context) {
	id, err := parseSupplierID(c)
	if err != nil {
		c.Error(err)
		return
	}

	item, svcErr := h.service.GetDetail(id)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Detail supplier",
		Data:    item,
	})
}

// POST /api/suppliers
func (h *SupplierHandler) Create(c *gin.Context) {
	var req dto_supplier.SupplierRequest
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
		Message: "Supplier berhasil ditambahkan",
		Data:    item,
	})
}

// PUT /api/suppliers/:id
func (h *SupplierHandler) Update(c *gin.Context) {
	id, err := parseSupplierID(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_supplier.SupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	item, svcErr := h.service.Update(id, &req)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Supplier berhasil diperbarui",
		Data:    item,
	})
}

// DELETE /api/suppliers/:id
func (h *SupplierHandler) Delete(c *gin.Context) {
	id, err := parseSupplierID(c)
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
		Message: "Supplier berhasil dihapus",
	})
}

// PATCH /api/suppliers/:id/toggle-status
func (h *SupplierHandler) ToggleStatus(c *gin.Context) {
	id, err := parseSupplierID(c)
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
		Message: "Status supplier berhasil diubah",
	})
}

func parseSupplierID(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID tidak valid"}
	}
	return id, nil
}
