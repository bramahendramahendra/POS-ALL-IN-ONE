package handler_expense

import (
	"strconv"

	global_dto "permen_api/dto"
	dto_expense "permen_api/domain/expense/dto"
	service_expense "permen_api/domain/expense/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"
	"permen_api/validation"

	"github.com/gin-gonic/gin"
)

type ExpenseHandler struct {
	service service_expense.ExpenseService
}

func NewExpenseHandler(service service_expense.ExpenseService) *ExpenseHandler {
	return &ExpenseHandler{service: service}
}

// GET /api/expenses
func (h *ExpenseHandler) GetAll(c *gin.Context) {
	filter := &dto_expense.ExpenseFilter{
		StartDate: c.Query("start_date"),
		EndDate:   c.Query("end_date"),
		Category:  c.Query("category"),
	}

	if uidStr := c.Query("user_id"); uidStr != "" {
		if uid, err := strconv.Atoi(uidStr); err == nil {
			filter.UserID = &uid
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
		Message: "Daftar pengeluaran",
		Data: gin.H{
			"items": items,
			"total": total,
			"page":  filter.Page,
			"limit": filter.Limit,
		},
	})
}

// GET /api/expenses/:id
func (h *ExpenseHandler) GetByID(c *gin.Context) {
	id, err := parseExpenseID(c)
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
		Message: "Detail pengeluaran",
		Data:    item,
	})
}

// POST /api/expenses
func (h *ExpenseHandler) Create(c *gin.Context) {
	var req dto_expense.ExpenseRequest
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
		Message: "Pengeluaran berhasil dicatat",
		Data:    item,
	})
}

// PUT /api/expenses/:id
func (h *ExpenseHandler) Update(c *gin.Context) {
	id, err := parseExpenseID(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_expense.ExpenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	if svcErr := h.service.Update(id, &req); svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Pengeluaran berhasil diperbarui",
	})
}

// DELETE /api/expenses/:id
func (h *ExpenseHandler) Delete(c *gin.Context) {
	id, err := parseExpenseID(c)
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
		Message: "Pengeluaran berhasil dihapus",
	})
}

func parseExpenseID(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID tidak valid"}
	}
	return id, nil
}
