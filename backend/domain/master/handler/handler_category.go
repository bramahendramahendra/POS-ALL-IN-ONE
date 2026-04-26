package handler_master

import (
	"strconv"

	global_dto "permen_api/dto"
	dto_master "permen_api/domain/master/dto"
	service_master "permen_api/domain/master/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"
	"permen_api/validation"

	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	service service_master.CategoryService
}

func NewCategoryHandler(service service_master.CategoryService) *CategoryHandler {
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
	id, err := parseMasterIDParam(c)
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
	var req dto_master.CreateCategoryRequest
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
	id, err := parseMasterIDParam(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_master.UpdateCategoryRequest
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

// DELETE /api/categories/:id
func (h *CategoryHandler) Delete(c *gin.Context) {
	id, err := parseMasterIDParam(c)
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

func parseMasterIDParam(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID tidak valid"}
	}
	return id, nil
}
