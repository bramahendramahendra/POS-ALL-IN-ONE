package handler_role

import (
	"strconv"

	dto_role "pos_api/domain/role/dto"
	service_role "pos_api/domain/role/service"
	global_dto "pos_api/dto"
	"pos_api/errors"
	"pos_api/helper"
	response_helper "pos_api/helper/response"
	"pos_api/validation"

	"github.com/gin-gonic/gin"
)

type RoleHandler struct {
	service service_role.RoleService
}

func NewRoleHandler(service service_role.RoleService) *RoleHandler {
	return &RoleHandler{service: service}
}

// GET /api/roles
func (h *RoleHandler) GetAll(c *gin.Context) {
	filter := &dto_role.RoleListFilter{
		Search: c.Query("search"),
	}
	if raw := c.Query("is_active"); raw != "" {
		v := raw == "true" || raw == "1"
		filter.IsActive = &v
	}

	roles, err := h.service.GetAll(filter)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar role",
		Data:    roles,
	})
}

// GET /api/roles/:id
func (h *RoleHandler) GetByID(c *gin.Context) {
	id, err := parseIDParam(c)
	if err != nil {
		c.Error(err)
		return
	}

	role, svcErr := h.service.GetByID(id)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Detail role",
		Data:    role,
	})
}

// POST /api/roles
func (h *RoleHandler) Create(c *gin.Context) {
	var req dto_role.CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	role, svcErr := h.service.Create(&req)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 201, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Role berhasil ditambahkan",
		Data:    role,
	})
}

// PUT /api/roles/:id
func (h *RoleHandler) Update(c *gin.Context) {
	id, err := parseIDParam(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_role.UpdateRoleRequest
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
		Message: "Role berhasil diperbarui",
	})
}

// DELETE /api/roles/:id
func (h *RoleHandler) Delete(c *gin.Context) {
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
		Message: "Role berhasil dihapus",
	})
}

// PATCH /api/roles/:id/toggle-status
func (h *RoleHandler) ToggleStatus(c *gin.Context) {
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
		Message: "Status role berhasil diubah",
	})
}

func parseIDParam(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID tidak valid"}
	}
	return id, nil
}
