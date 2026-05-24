package handler_menu

import (
	"strconv"

	dto_menu "pos_api/domain/menu/dto"
	service_menu "pos_api/domain/menu/service"
	global_dto "pos_api/dto"
	"pos_api/errors"
	"pos_api/helper"
	response_helper "pos_api/helper/response"
	"pos_api/validation"

	"github.com/gin-gonic/gin"
)

type MenuHandler struct {
	service service_menu.MenuService
}

func NewMenuHandler(service service_menu.MenuService) *MenuHandler {
	return &MenuHandler{service: service}
}

// GET /api/menus
func (h *MenuHandler) GetAll(c *gin.Context) {
	filter := &dto_menu.MenuListFilter{
		Search: c.Query("search"),
	}
	if raw := c.Query("is_active"); raw != "" {
		v := raw == "true" || raw == "1"
		filter.IsActive = &v
	}

	menus, err := h.service.GetAll(filter)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar menu",
		Data:    menus,
	})
}

// GET /api/menus/my — menu tree untuk user yang sedang login
func (h *MenuHandler) GetMyMenus(c *gin.Context) {
	roleName := helper.GetUserRole(c)

	menus, err := h.service.GetMyMenus(roleName)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Menu akses",
		Data:    menus,
	})
}

// GET /api/menus/:id
func (h *MenuHandler) GetByID(c *gin.Context) {
	id, err := parseIDParam(c)
	if err != nil {
		c.Error(err)
		return
	}

	menu, svcErr := h.service.GetByID(id)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Detail menu",
		Data:    menu,
	})
}

// POST /api/menus
func (h *MenuHandler) Create(c *gin.Context) {
	var req dto_menu.CreateMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	menu, svcErr := h.service.Create(&req)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 201, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Menu berhasil ditambahkan",
		Data:    menu,
	})
}

// PUT /api/menus/:id
func (h *MenuHandler) Update(c *gin.Context) {
	id, err := parseIDParam(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_menu.UpdateMenuRequest
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
		Message: "Menu berhasil diperbarui",
	})
}

// DELETE /api/menus/:id
func (h *MenuHandler) Delete(c *gin.Context) {
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
		Message: "Menu berhasil dihapus",
	})
}

// PATCH /api/menus/reorder
func (h *MenuHandler) Reorder(c *gin.Context) {
	var req dto_menu.ReorderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	if svcErr := h.service.Reorder(&req); svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Urutan menu berhasil diperbarui",
	})
}

func parseIDParam(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID tidak valid"}
	}
	return id, nil
}
