package handler_receivable

import (
	"strconv"

	global_dto "permen_api/dto"
	dto_receivable "permen_api/domain/receivable/dto"
	service_receivable "permen_api/domain/receivable/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"
	"permen_api/validation"

	"github.com/gin-gonic/gin"
)

type ReceivableHandler struct {
	service service_receivable.ReceivableService
}

func NewReceivableHandler(service service_receivable.ReceivableService) *ReceivableHandler {
	return &ReceivableHandler{service: service}
}

// GET /api/receivables
func (h *ReceivableHandler) GetAll(c *gin.Context) {
	filter := &dto_receivable.ReceivableFilter{
		Search: c.Query("search"),
		Status: c.Query("status"),
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
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar piutang",
		Data: gin.H{
			"items": items,
			"total": total,
			"page":  filter.Page,
			"limit": filter.Limit,
		},
	})
}

// GET /api/receivables/summary
func (h *ReceivableHandler) GetSummary(c *gin.Context) {
	items, err := h.service.GetSummary()
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Ringkasan piutang per pelanggan",
		Data:    items,
	})
}

// GET /api/receivables/:id
func (h *ReceivableHandler) GetByID(c *gin.Context) {
	id, err := parseReceivableID(c)
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
		Message: "Detail piutang",
		Data:    item,
	})
}

// GET /api/receivables/:id/payments
func (h *ReceivableHandler) GetPayments(c *gin.Context) {
	id, err := parseReceivableID(c)
	if err != nil {
		c.Error(err)
		return
	}

	items, svcErr := h.service.GetPayments(id)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Riwayat pembayaran piutang",
		Data:    items,
	})
}

// POST /api/receivables/:id/pay
func (h *ReceivableHandler) Pay(c *gin.Context) {
	id, err := parseReceivableID(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_receivable.PayRequest
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

	result, svcErr := h.service.Pay(id, &req, uid)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Pembayaran piutang berhasil",
		Data:    result,
	})
}

func parseReceivableID(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID tidak valid"}
	}
	return id, nil
}
