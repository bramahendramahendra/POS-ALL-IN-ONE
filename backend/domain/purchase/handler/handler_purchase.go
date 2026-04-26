package handler_purchase

import (
	"strconv"

	global_dto "permen_api/dto"
	dto_purchase "permen_api/domain/purchase/dto"
	service_purchase "permen_api/domain/purchase/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"
	"permen_api/validation"

	"github.com/gin-gonic/gin"
)

type PurchaseHandler struct {
	service service_purchase.PurchaseService
}

func NewPurchaseHandler(service service_purchase.PurchaseService) *PurchaseHandler {
	return &PurchaseHandler{service: service}
}

// GET /api/purchases
func (h *PurchaseHandler) GetAll(c *gin.Context) {
	filter := &dto_purchase.PurchaseFilter{
		StartDate:     c.Query("start_date"),
		EndDate:       c.Query("end_date"),
		PaymentStatus: c.Query("payment_status"),
	}

	if sidStr := c.Query("supplier_id"); sidStr != "" {
		if sid, err := strconv.Atoi(sidStr); err == nil {
			filter.SupplierID = &sid
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
		Message: "Daftar purchase order",
		Data: gin.H{
			"items": items,
			"total": total,
			"page":  filter.Page,
			"limit": filter.Limit,
		},
	})
}

// GET /api/purchases/:id
func (h *PurchaseHandler) GetByID(c *gin.Context) {
	id, err := parsePurchaseID(c)
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
		Message: "Detail purchase order",
		Data:    item,
	})
}

// GET /api/purchases/:id/items
func (h *PurchaseHandler) GetItems(c *gin.Context) {
	id, err := parsePurchaseID(c)
	if err != nil {
		c.Error(err)
		return
	}

	items, svcErr := h.service.GetItems(id)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Item purchase order",
		Data:    items,
	})
}

// POST /api/purchases
func (h *PurchaseHandler) Create(c *gin.Context) {
	var req dto_purchase.PurchaseRequest
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
		Message: "Purchase order berhasil dibuat",
		Data:    item,
	})
}

// PUT /api/purchases/:id
func (h *PurchaseHandler) Update(c *gin.Context) {
	id, err := parsePurchaseID(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_purchase.PurchaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	item, svcErr := h.service.Update(id, &req)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Purchase order berhasil diperbarui",
		Data:    item,
	})
}

// DELETE /api/purchases/:id
func (h *PurchaseHandler) Delete(c *gin.Context) {
	id, err := parsePurchaseID(c)
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
		Message: "Purchase order berhasil dihapus",
	})
}

// POST /api/purchases/:id/pay
func (h *PurchaseHandler) Pay(c *gin.Context) {
	id, err := parsePurchaseID(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_purchase.PayPurchaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	if svcErr := h.service.Pay(id, &req); svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Pembayaran purchase order berhasil dicatat",
	})
}

func parsePurchaseID(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID tidak valid"}
	}
	return id, nil
}
