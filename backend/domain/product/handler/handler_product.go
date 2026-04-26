package handler_product

import (
	"path/filepath"
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

type ProductHandler struct {
	service service_product.ProductService
}

func NewProductHandler(service service_product.ProductService) *ProductHandler {
	return &ProductHandler{service: service}
}

// GET /api/products
func (h *ProductHandler) GetAll(c *gin.Context) {
	filter := &dto_product.ProductFilter{
		Search: c.Query("search"),
	}

	if catStr := c.Query("category_id"); catStr != "" {
		if catID, err := strconv.Atoi(catStr); err == nil {
			filter.CategoryID = &catID
		}
	}

	if activeStr := c.Query("is_active"); activeStr != "" {
		active := activeStr == "1" || activeStr == "true"
		filter.IsActive = &active
	}

	if c.Query("low_stock") == "1" {
		filter.LowStock = true
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	filter.Page = page
	filter.Limit = limit

	products, total, err := h.service.GetAll(filter)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Daftar produk",
		Data: gin.H{
			"items": products,
			"total": total,
			"page":  filter.Page,
			"limit": filter.Limit,
		},
	})
}

// GET /api/products/search
func (h *ProductHandler) Search(c *gin.Context) {
	keyword := c.Query("q")
	if keyword == "" {
		c.Error(&errors.BadRequestError{Message: "Parameter q diperlukan"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	results, err := h.service.Search(keyword, limit)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Hasil pencarian produk",
		Data:    results,
	})
}

// GET /api/products/barcode/:barcode
func (h *ProductHandler) GetByBarcode(c *gin.Context) {
	barcode := c.Param("barcode")
	if barcode == "" {
		c.Error(&errors.BadRequestError{Message: "Barcode diperlukan"})
		return
	}

	product, err := h.service.GetByBarcode(barcode)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Detail produk",
		Data:    product,
	})
}

// GET /api/products/:id
func (h *ProductHandler) GetByID(c *gin.Context) {
	id, err := parseProductID(c)
	if err != nil {
		c.Error(err)
		return
	}

	product, svcErr := h.service.GetByID(id)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Detail produk",
		Data:    product,
	})
}

// POST /api/products
func (h *ProductHandler) Create(c *gin.Context) {
	var req dto_product.ProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}
	if err := validation.Validate.Struct(req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	product, err := h.service.Create(&req)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 201, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Produk berhasil dibuat",
		Data:    product,
	})
}

// POST /api/products/import
func (h *ProductHandler) Import(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.Error(&errors.BadRequestError{Message: "File tidak ditemukan"})
		return
	}

	ext := filepath.Ext(file.Filename)
	if ext != ".xlsx" && ext != ".xls" && ext != ".csv" {
		c.Error(&errors.BadRequestError{Message: "Format file harus .xlsx atau .csv"})
		return
	}

	result, err := h.service.ImportFromFile(file)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code: helper.StatusOk, Status: true, Message: "Import selesai", Data: result,
	})
}

// PUT /api/products/:id
func (h *ProductHandler) Update(c *gin.Context) {
	id, err := parseProductID(c)
	if err != nil {
		c.Error(err)
		return
	}

	var req dto_product.ProductRequest
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
		Message: "Produk berhasil diperbarui",
	})
}

// DELETE /api/products/:id
func (h *ProductHandler) Delete(c *gin.Context) {
	id, err := parseProductID(c)
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
		Message: "Produk berhasil dihapus",
	})
}

// PATCH /api/products/:id/toggle-status
func (h *ProductHandler) ToggleStatus(c *gin.Context) {
	id, err := parseProductID(c)
	if err != nil {
		c.Error(err)
		return
	}

	if svcErr := h.service.ToggleStatus(id); svcErr != nil {
		c.Error(svcErr)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Status produk berhasil diubah",
	})
}

func parseProductID(c *gin.Context) (int, error) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return 0, &errors.BadRequestError{Message: "ID tidak valid"}
	}
	return id, nil
}
