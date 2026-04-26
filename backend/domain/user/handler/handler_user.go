package handler_user

import (
	"strconv"

	global_dto "permen_api/dto"
	dto_user "permen_api/domain/user/dto"
	service_user "permen_api/domain/user/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"
	"permen_api/validation"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	service service_user.UserService
}

func NewUserHandler(service service_user.UserService) *UserHandler {
	return &UserHandler{service: service}
}

// GET /api/users
func (h *UserHandler) GetAll(c *gin.Context) {
	filter := &dto_user.UserListFilter{
		Search: c.Query("search"),
		Role:   c.Query("role"),
	}

	if raw := c.Query("is_active"); raw != "" {
		v := raw == "true" || raw == "1"
		filter.IsActive = &v
	}

	users, err := h.service.GetAll(filter)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar user",
		Data:    users,
	})
}

// GET /api/users/:id
func (h *UserHandler) GetByID(c *gin.Context) {
	id, err := parseIDParam(c)
	if err != nil {
		c.Error(err)
		return
	}

	user, svcErr := h.service.GetByID(id)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Detail user",
		Data:    user,
	})
}

// POST /api/users
func (h *UserHandler) Create(c *gin.Context) {
	var req dto_user.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	user, err := h.service.Create(&req)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 201, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "User berhasil dibuat",
		Data:    user,
	})
}

// PUT /api/users/:id
func (h *UserHandler) Update(c *gin.Context) {
	id, err := parseIDParam(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_user.UpdateUserRequest
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
		Message: "User berhasil diperbarui",
	})
}

// DELETE /api/users/:id
func (h *UserHandler) Delete(c *gin.Context) {
	id, err := parseIDParam(c)
	if err != nil {
		c.Error(err)
		return
	}

	currentUserID := helper.GetUserID(c)

	if svcErr := h.service.Delete(id, currentUserID); svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "User berhasil dihapus",
	})
}

// PATCH /api/users/:id/toggle-status
func (h *UserHandler) ToggleStatus(c *gin.Context) {
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
		Message: "Status user berhasil diubah",
	})
}

func parseIDParam(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID tidak valid"}
	}
	return id, nil
}
