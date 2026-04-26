package handler_stock_mutation

import (
	"strconv"

	global_dto "permen_api/dto"
	dto_stock_mutation "permen_api/domain/stock_mutation/dto"
	service_stock_mutation "permen_api/domain/stock_mutation/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"

	"github.com/gin-gonic/gin"
)

type StockMutationHandler struct {
	service service_stock_mutation.StockMutationService
}

func NewStockMutationHandler(service service_stock_mutation.StockMutationService) *StockMutationHandler {
	return &StockMutationHandler{service: service}
}

// GET /api/stock-mutations
func (h *StockMutationHandler) GetAll(c *gin.Context) {
	filter := &dto_stock_mutation.StockMutationFilter{
		MutationType:  c.Query("mutation_type"),
		ReferenceType: c.Query("reference_type"),
		DateFrom:      c.Query("date_from"),
		DateTo:        c.Query("date_to"),
	}

	if pidStr := c.Query("product_id"); pidStr != "" {
		if pid, err := strconv.Atoi(pidStr); err == nil {
			filter.ProductID = &pid
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
		Message: "Daftar mutasi stok",
		Data: gin.H{
			"items": items,
			"total": total,
			"page":  filter.Page,
			"limit": filter.Limit,
		},
	})
}

// GET /api/stock-mutations/product/:product_id
func (h *StockMutationHandler) GetByProduct(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("product_id"))
	if err != nil || productID <= 0 {
		c.Error(&errors.BadRequestError{Message: "product_id tidak valid"})
		return
	}

	items, svcErr := h.service.GetByProduct(productID)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Riwayat mutasi stok produk",
		Data:    items,
	})
}
