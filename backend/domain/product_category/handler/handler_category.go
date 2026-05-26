package handler_product_category

import (
	"strconv"

	dto_product_category "pos_api/domain/product_category/dto"
	service_product_category "pos_api/domain/product_category/service"
	global_dto "pos_api/dto"
	"pos_api/errors"
	"pos_api/helper"
	response_helper "pos_api/helper/response"
	"pos_api/validation"

	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	service service_product_category.CategoryService
}

func NewCategoryHandler(service service_product_category.CategoryService) *CategoryHandler {
	return &CategoryHandler{service: service}
}

// GET /api/categories
func (h *CategoryHandler) GetAll(c *gin.Context) {
	categories, err := h.service.GetAll()
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar kategori",
		Data:    categories,
	})
}

// GET /api/categories/:id
func (h *CategoryHandler) GetByID(c *gin.Context) {
	id, err := parseIDParam(c)
	if err != nil {
		c.Error(err)
		return
	}

	category, svcErr := h.service.GetByID(id)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Detail kategori",
		Data:    category,
	})
}

// POST /api/categories
func (h *CategoryHandler) Create(c *gin.Context) {
	var req dto_product_category.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	category, err := h.service.Create(&req)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 201, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Kategori berhasil dibuat",
		Data:    category,
	})
}

// PUT /api/categories/:id
func (h *CategoryHandler) Update(c *gin.Context) {
	id, err := parseIDParam(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_product_category.UpdateCategoryRequest
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
		Message: "Kategori berhasil diperbarui",
	})
}

// PATCH /api/categories/:id/toggle-status
func (h *CategoryHandler) ToggleStatus(c *gin.Context) {
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
		Message: "Status kategori berhasil diperbarui",
	})
}

// DELETE /api/categories/:id
func (h *CategoryHandler) Delete(c *gin.Context) {
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
		Message: "Kategori berhasil dihapus",
	})
}

func parseIDParam(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID tidak valid"}
	}
	return id, nil
}
