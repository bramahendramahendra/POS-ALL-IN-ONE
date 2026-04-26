package handler_product

import (
	global_dto "permen_api/dto"
	dto_product "permen_api/domain/product/dto"
	service_product "permen_api/domain/product/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"
	"permen_api/validation"

	"github.com/gin-gonic/gin"
)

type ProductPriceHandler struct {
	service service_product.ProductPriceService
}

func NewProductPriceHandler(service service_product.ProductPriceService) *ProductPriceHandler {
	return &ProductPriceHandler{service: service}
}

// GET /api/products/:product_id/prices
func (h *ProductPriceHandler) GetByProduct(c *gin.Context) {
	productID, err := parseParamID(c, "product_id")
	if err != nil {
		c.Error(err)
		return
	}

	prices, svcErr := h.service.GetByProduct(productID)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar harga tier produk",
		Data:    prices,
	})
}

// POST /api/products/:product_id/prices
func (h *ProductPriceHandler) Save(c *gin.Context) {
	productID, err := parseParamID(c, "product_id")
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_product.SaveProductPricesRequest
	if bindErr := c.ShouldBindJSON(&req); bindErr != nil {
		c.Error(&errors.BadRequestError{Message: bindErr.Error()})
		return
	}
	if valErr := validation.Validate.Struct(req); valErr != nil {
		c.Error(&errors.BadRequestError{Message: valErr.Error()})
		return
	}

	if svcErr := h.service.Save(productID, req.Prices); svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Harga tier produk berhasil disimpan",
	})
}
