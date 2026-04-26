package handler_product

import (
	"strconv"

	global_dto "permen_api/dto"
	dto_product "permen_api/domain/product/dto"
	service_product "permen_api/domain/product/service"
	"permen_api/errors"
	"permen_api/helper"
	response_helper "permen_api/helper/response"
	"permen_api/validation"

	"github.com/gin-gonic/gin"
)

type ProductUnitHandler struct {
	service service_product.ProductUnitService
}

func NewProductUnitHandler(service service_product.ProductUnitService) *ProductUnitHandler {
	return &ProductUnitHandler{service: service}
}

// GET /api/products/:product_id/units
func (h *ProductUnitHandler) GetByProduct(c *gin.Context) {
	productID, err := parseParamID(c, "product_id")
	if err != nil {
		c.Error(err)
		return
	}

	units, svcErr := h.service.GetByProduct(productID)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar unit produk",
		Data:    units,
	})
}

// POST /api/products/:product_id/units
func (h *ProductUnitHandler) Save(c *gin.Context) {
	productID, err := parseParamID(c, "product_id")
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_product.SaveProductUnitsRequest
	if bindErr := c.ShouldBindJSON(&req); bindErr != nil {
		c.Error(&errors.BadRequestError{Message: bindErr.Error()})
		return
	}
	if valErr := validation.Validate.Struct(req); valErr != nil {
		c.Error(&errors.BadRequestError{Message: valErr.Error()})
		return
	}

	if svcErr := h.service.Save(productID, req.Units); svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Unit produk berhasil disimpan",
	})
}

// DELETE /api/products/:product_id/units/:unit_id
func (h *ProductUnitHandler) Delete(c *gin.Context) {
	productID, err := parseParamID(c, "product_id")
	if err != nil {
		c.Error(err)
		return
	}

	unitID, err := parseParamID(c, "unit_id")
	if err != nil {
		c.Error(err)
		return
	}

	if svcErr := h.service.DeleteOne(unitID, productID); svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Unit produk berhasil dihapus",
	})
}

func parseParamID(c *gin.Context, param string) (int, error) {
	id, err := strconv.Atoi(c.Param(param))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: param + " tidak valid"}
	}
	return id, nil
}
