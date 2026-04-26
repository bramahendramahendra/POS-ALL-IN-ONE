package handler_customer

import (
	"strconv"

	global_dto "permen_api/dto"
	dto_customer "permen_api/domain/customer/dto"
	service_customer "permen_api/domain/customer/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"
	"permen_api/validation"

	"github.com/gin-gonic/gin"
)

type CustomerHandler struct {
	service service_customer.CustomerService
}

func NewCustomerHandler(service service_customer.CustomerService) *CustomerHandler {
	return &CustomerHandler{service: service}
}

// GET /api/customers
func (h *CustomerHandler) GetAll(c *gin.Context) {
	filter := &dto_customer.CustomerFilter{
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
		Message: "Daftar pelanggan",
		Data: gin.H{
			"items": items,
			"total": total,
			"page":  filter.Page,
			"limit": filter.Limit,
		},
	})
}

// GET /api/customers/active
func (h *CustomerHandler) GetActiveList(c *gin.Context) {
	items, err := h.service.GetActiveList()
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar pelanggan aktif",
		Data:    items,
	})
}

// GET /api/customers/:id
func (h *CustomerHandler) GetByID(c *gin.Context) {
	id, err := parseCustomerID(c)
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
		Message: "Detail pelanggan",
		Data:    item,
	})
}

// POST /api/customers
func (h *CustomerHandler) Create(c *gin.Context) {
	var req dto_customer.CustomerRequest
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
		Message: "Pelanggan berhasil ditambahkan",
		Data:    item,
	})
}

// PUT /api/customers/:id
func (h *CustomerHandler) Update(c *gin.Context) {
	id, err := parseCustomerID(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_customer.CustomerRequest
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
		Message: "Pelanggan berhasil diperbarui",
		Data:    item,
	})
}

// DELETE /api/customers/:id
func (h *CustomerHandler) Delete(c *gin.Context) {
	id, err := parseCustomerID(c)
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
		Message: "Pelanggan berhasil dihapus",
	})
}

// PATCH /api/customers/:id/toggle-status
func (h *CustomerHandler) ToggleStatus(c *gin.Context) {
	id, err := parseCustomerID(c)
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
		Message: "Status pelanggan berhasil diubah",
	})
}

func parseCustomerID(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID tidak valid"}
	}
	return id, nil
}
