package handler_transaction

import (
	"strconv"

	global_dto "permen_api/dto"
	dto_transaction "permen_api/domain/transaction/dto"
	service_transaction "permen_api/domain/transaction/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"
	"permen_api/validation"

	"github.com/gin-gonic/gin"
)

type TransactionHandler struct {
	service service_transaction.TransactionService
}

func NewTransactionHandler(service service_transaction.TransactionService) *TransactionHandler {
	return &TransactionHandler{service: service}
}

// GET /api/transactions
func (h *TransactionHandler) GetAll(c *gin.Context) {
	filter := &dto_transaction.TransactionFilter{
		Status:        c.Query("status"),
		PaymentMethod: c.Query("payment_method"),
		DateFrom:      c.Query("date_from"),
		DateTo:        c.Query("date_to"),
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

	transactions, total, err := h.service.GetAll(filter)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:   helper.StatusOk,
		Status: true,
		Message: "Daftar transaksi",
		Data: gin.H{
			"items": transactions,
			"total": total,
			"page":  filter.Page,
			"limit": filter.Limit,
		},
	})
}

// GET /api/transactions/:id
func (h *TransactionHandler) GetByID(c *gin.Context) {
	id, err := parseTransactionID(c)
	if err != nil {
		c.Error(err)
		return
	}

	t, svcErr := h.service.GetByID(id)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Detail transaksi",
		Data:    t,
	})
}

// POST /api/transactions
func (h *TransactionHandler) Create(c *gin.Context) {
	var req dto_transaction.CreateTransactionRequest
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

	resp, err := h.service.Create(&req, uid)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 201, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Transaksi berhasil dibuat",
		Data:    resp,
	})
}

// PATCH /api/transactions/:id/void
func (h *TransactionHandler) Void(c *gin.Context) {
	id, err := parseTransactionID(c)
	if err != nil {
		c.Error(err)
		return
	}

	userID, _ := c.Get("user_id")
	uid, _ := userID.(int)

	if svcErr := h.service.Void(id, uid); svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Transaksi berhasil di-void",
	})
}

func parseTransactionID(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID tidak valid"}
	}
	return id, nil
}
