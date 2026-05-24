package handler_access

import (
	"strconv"

	dto_access "pos_api/domain/access/dto"
	service_access "pos_api/domain/access/service"
	global_dto "pos_api/dto"
	"pos_api/errors"
	"pos_api/helper"
	response_helper "pos_api/helper/response"
	"pos_api/validation"

	"github.com/gin-gonic/gin"
)

type AccessHandler struct {
	service service_access.AccessService
}

func NewAccessHandler(service service_access.AccessService) *AccessHandler {
	return &AccessHandler{service: service}
}

// GET /api/roles/:id/menus — ambil semua menu + status akses untuk role ini
func (h *AccessHandler) GetByRoleID(c *gin.Context) {
	roleID, err := parseRoleID(c)
	if err != nil {
		c.Error(err)
		return
	}

	items, svcErr := h.service.GetByRoleID(roleID)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Akses menu role",
		Data:    items,
	})
}

// PUT /api/roles/:id/menus — simpan akses menu untuk role ini (replace all)
func (h *AccessHandler) SetRoleAccess(c *gin.Context) {
	roleID, err := parseRoleID(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_access.SetRoleAccessRequest
	if bindErr := c.ShouldBindJSON(&req); bindErr != nil {
		c.Error(&errors.BadRequestError{Message: bindErr.Error()})
		return
	}
	if valErr := validation.Validate.Struct(req); valErr != nil {
		c.Error(&errors.BadRequestError{Message: valErr.Error()})
		return
	}

	if svcErr := h.service.SetRoleAccess(roleID, &req); svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Akses menu role berhasil disimpan",
	})
}

func parseRoleID(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID role tidak valid"}
	}
	return id, nil
}
