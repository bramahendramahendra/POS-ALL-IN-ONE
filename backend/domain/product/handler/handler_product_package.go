package handler_product

import (
	dto_product "pos_api/domain/product/dto"
	service_product "pos_api/domain/product/service"
	global_dto "pos_api/dto"
	"pos_api/errors"
	"pos_api/helper"
	response_helper "pos_api/helper/response"
	"pos_api/validation"

	"github.com/gin-gonic/gin"
)

type ProductPackageHandler struct {
	service service_product.ProductPackageService
}

func NewProductPackageHandler(service service_product.ProductPackageService) *ProductPackageHandler {
	return &ProductPackageHandler{service: service}
}

// GET /api/products/:id/packages
func (h *ProductPackageHandler) GetByProduct(c *gin.Context) {
	productID, err := parseParamID(c, "id")
	if err != nil {
		c.Error(err)
		return
	}

	packages, svcErr := h.service.GetByProduct(productID)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar paket produk",
		Data:    packages,
	})
}

// POST /api/products/:id/packages
func (h *ProductPackageHandler) Save(c *gin.Context) {
	productID, err := parseParamID(c, "id")
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_product.SaveProductPackagesRequest
	if bindErr := c.ShouldBindJSON(&req); bindErr != nil {
		c.Error(&errors.BadRequestError{Message: bindErr.Error()})
		return
	}
	if valErr := validation.Validate.Struct(req); valErr != nil {
		c.Error(&errors.BadRequestError{Message: valErr.Error()})
		return
	}

	if svcErr := h.service.Save(productID, req.Packages); svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Paket produk berhasil disimpan",
	})
}

// DELETE /api/products/:id/packages/:package_id
func (h *ProductPackageHandler) Delete(c *gin.Context) {
	productID, err := parseParamID(c, "id")
	if err != nil {
		c.Error(err)
		return
	}

	packageID, err := parseParamID(c, "package_id")
	if err != nil {
		c.Error(err)
		return
	}

	if svcErr := h.service.DeleteOne(packageID, productID); svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Paket produk berhasil dihapus",
	})
}
