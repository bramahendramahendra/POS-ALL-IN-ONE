package handler_cash_drawer

import (
	"strconv"

	dto_cash_drawer "pos_api/domain/cash_drawer/dto"
	service_cash_drawer "pos_api/domain/cash_drawer/service"
	global_dto "pos_api/dto"
	"pos_api/errors"
	"pos_api/helper"
	response_helper "pos_api/helper/response"

	"github.com/gin-gonic/gin"
)

type CashDrawerHandler struct {
	service service_cash_drawer.CashDrawerService
}

func NewCashDrawerHandler(service service_cash_drawer.CashDrawerService) *CashDrawerHandler {
	return &CashDrawerHandler{service: service}
}

// GET /api/cash-drawer/current
func (h *CashDrawerHandler) GetCurrent(c *gin.Context) {
	userID, _ := c.Get("user_id")
	uid, _ := userID.(int)

	res, err := h.service.GetCurrent(uid)
	if err != nil {
		c.Error(err)
		return
	}

	msg := "Success"
	if res == nil {
		msg = "Tidak ada kas yang terbuka"
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: msg,
		Data:    res,
	})
}

// GET /api/cash-drawer
func (h *CashDrawerHandler) GetHistory(c *gin.Context) {
	filter := &dto_cash_drawer.CashDrawerFilter{
		StartDate: c.Query("start_date"),
		EndDate:   c.Query("end_date"),
		Status:    c.Query("status"),
	}

	role := helper.GetUserRole(c)
	requestingUserID := helper.GetUserID(c)

	if role == "owner" || role == "admin" {
		// owner/admin boleh filter by user_id lain
		if uidStr := c.Query("user_id"); uidStr != "" {
			if uid, err := strconv.Atoi(uidStr); err == nil {
				filter.UserID = &uid
			}
		}
	} else {
		// kasir hanya boleh melihat riwayat miliknya sendiri
		filter.UserID = &requestingUserID
	}

	if shiftStr := c.Query("shift_id"); shiftStr != "" {
		if sid, err := strconv.Atoi(shiftStr); err == nil {
			filter.ShiftID = &sid
		}
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	filter.Page = page
	filter.Limit = limit

	items, total, err := h.service.GetHistory(filter)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Riwayat kas",
		Data: gin.H{
			"items": items,
			"total": total,
			"page":  filter.Page,
			"limit": filter.Limit,
		},
	})
}

// GET /api/cash-drawer/:id
func (h *CashDrawerHandler) GetByID(c *gin.Context) {
	id, err := parseCashDrawerID(c)
	if err != nil {
		c.Error(err)
		return
	}

	res, svcErr := h.service.GetByID(id, helper.GetUserID(c), helper.GetUserRole(c))
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Detail kas",
		Data:    res,
	})
}

// POST /api/cash-drawer/open
func (h *CashDrawerHandler) Open(c *gin.Context) {
	var req dto_cash_drawer.OpenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	uid, _ := userID.(int)

	res, err := h.service.Open(uid, &req)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 201, "json", &global_dto.ResponseParams{
		Code:    helper.StatusCreated,
		Status:  true,
		Message: "Kas berhasil dibuka",
		Data:    res,
	})
}

// POST /api/cash-drawer/:id/close
func (h *CashDrawerHandler) Close(c *gin.Context) {
	id, err := parseCashDrawerID(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_cash_drawer.CloseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	res, svcErr := h.service.Close(id, &req, helper.GetUserID(c), helper.GetUserRole(c))
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Kas berhasil ditutup",
		Data:    res,
	})
}

// PATCH /api/cash-drawer/:id/update-sales
func (h *CashDrawerHandler) UpdateSales(c *gin.Context) {
	id, err := parseCashDrawerID(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_cash_drawer.UpdateSalesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	if svcErr := h.service.UpdateSales(id, &req, helper.GetUserID(c), helper.GetUserRole(c)); svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Data penjualan berhasil diperbarui",
	})
}

// PATCH /api/cash-drawer/:id/update-expenses
func (h *CashDrawerHandler) UpdateExpenses(c *gin.Context) {
	id, err := parseCashDrawerID(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_cash_drawer.UpdateExpensesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	if svcErr := h.service.UpdateExpenses(id, &req, helper.GetUserID(c), helper.GetUserRole(c)); svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Data pengeluaran berhasil diperbarui",
	})
}

func parseCashDrawerID(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID tidak valid"}
	}
	return id, nil
}
