package handler_product

import (
	"fmt"
	"path/filepath"
	"strconv"

	dto_product "pos_api/domain/product/dto"
	service_product "pos_api/domain/product/service"
	global_dto "pos_api/dto"
	"pos_api/errors"
	"pos_api/helper"
	response_helper "pos_api/helper/response"
	"pos_api/validation"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
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

	if ls := c.Query("low_stock"); ls == "1" || ls == "true" {
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

// GET /api/products/generate-barcode
func (h *ProductHandler) GenerateBarcode(c *gin.Context) {
	result, err := h.service.GenerateBarcode()
	if err != nil {
		c.Error(err)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Barcode berhasil digenerate",
		Data:    result,
	})
}

// GET /api/products/generate-sku
func (h *ProductHandler) GenerateSku(c *gin.Context) {
	categoryIDStr := c.Query("category_id")
	if categoryIDStr == "" {
		c.Error(&errors.BadRequestError{Message: "Parameter category_id diperlukan"})
		return
	}
	categoryID, err := strconv.Atoi(categoryIDStr)
	if err != nil || categoryID <= 0 {
		c.Error(&errors.BadRequestError{Message: "category_id tidak valid"})
		return
	}

	result, svcErr := h.service.GenerateSku(categoryID)
	if svcErr != nil {
		c.Error(svcErr)
		return
	}
	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "SKU berhasil digenerate",
		Data:    result,
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

// POST /api/products/import-bulk
func (h *ProductHandler) ImportBulk(c *gin.Context) {
	var req dto_product.BulkImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(&errors.BadRequestError{Message: err.Error()})
		return
	}

	result, err := h.service.ImportBulk(req)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Import selesai",
		Data:    result,
	})
}

// GET /api/products/import-template
func (h *ProductHandler) DownloadImportTemplate(c *gin.Context) {
	categoryNames, err := h.service.GetCategoryNames()
	if err != nil {
		c.Error(err)
		return
	}
	unitNames, err := h.service.GetUnitNames()
	if err != nil {
		c.Error(err)
		return
	}

	f := excelize.NewFile()
	defer f.Close()

	// ── Sheet 1: Produk ──────────────────────────────────────────────────────
	sheetProduk := "Produk"
	f.SetSheetName("Sheet1", sheetProduk)

	prodHeaders := []string{"no", "nama", "deskripsi", "barcode", "kategori", "harga_beli", "harga_jual", "stok", "stok_minimum", "satuan"}
	prodExample := []interface{}{1, "Contoh Produk A", "Deskripsi opsional", "", "Minuman", 5000, 7000, 100, 10, "pcs"}

	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "#FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#4472C4"}, Pattern: 1},
	})
	noteStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Italic: true, Color: "#7F7F7F", Size: 9},
	})

	for col, h := range prodHeaders {
		cell, _ := excelize.CoordinatesToCellName(col+1, 1)
		f.SetCellValue(sheetProduk, cell, h)
	}
	for col, val := range prodExample {
		cell, _ := excelize.CoordinatesToCellName(col+1, 2)
		f.SetCellValue(sheetProduk, cell, val)
	}
	f.SetCellStyle(sheetProduk, "A1", "J1", headerStyle)

	// Note baris 3
	f.SetCellValue(sheetProduk, "A3", "* no: nomor unik dalam file ini (dipakai sheet Grosir). barcode & deskripsi opsional.")
	f.SetCellStyle(sheetProduk, "A3", "J3", noteStyle)
	f.MergeCell(sheetProduk, "A3", "J3")

	prodColWidths := map[string]float64{
		"A": 6, "B": 24, "C": 28, "D": 18, "E": 20,
		"F": 14, "G": 14, "H": 10, "I": 14, "J": 14,
	}
	for col, w := range prodColWidths {
		f.SetColWidth(sheetProduk, col, col, w)
	}

	// Dropdown kategori (kolom E) referensi Sheet3!$A$2:$A$N
	if len(categoryNames) > 0 {
		lastCatRow := len(categoryNames) + 1
		catRef := fmt.Sprintf("Kategori!$A$2:$A$%d", lastCatRow)
		dv := excelize.NewDataValidation(true)
		dv.Sqref = "E2:E1000"
		dv.SetDropList([]string{catRef})
		dv.ShowDropDown = true
		f.AddDataValidation(sheetProduk, dv)
	}

	// Dropdown satuan (kolom J) referensi Sheet4!$A$2:$A$N
	if len(unitNames) > 0 {
		lastUnitRow := len(unitNames) + 1
		unitRef := fmt.Sprintf("Satuan!$A$2:$A$%d", lastUnitRow)
		dv2 := excelize.NewDataValidation(true)
		dv2.Sqref = "J2:J1000"
		dv2.SetDropList([]string{unitRef})
		dv2.ShowDropDown = true
		f.AddDataValidation(sheetProduk, dv2)
	}

	// ── Sheet 2: Grosir ──────────────────────────────────────────────────────
	sheetGrosir := "Grosir"
	f.NewSheet(sheetGrosir)

	grosirHeaders := []string{"no_produk", "nama_paket", "konversi", "harga_beli", "harga_jual"}
	grosirExample := []interface{}{1, "Dus (12 pcs)", 12, 55000, 75000}

	for col, h := range grosirHeaders {
		cell, _ := excelize.CoordinatesToCellName(col+1, 1)
		f.SetCellValue(sheetGrosir, cell, h)
	}
	for col, val := range grosirExample {
		cell, _ := excelize.CoordinatesToCellName(col+1, 2)
		f.SetCellValue(sheetGrosir, cell, val)
	}
	f.SetCellStyle(sheetGrosir, "A1", "E1", headerStyle)

	f.SetCellValue(sheetGrosir, "A3", "* no_produk: isi dengan nilai kolom 'no' dari sheet Produk. Satu produk bisa punya banyak paket grosir.")
	f.SetCellStyle(sheetGrosir, "A3", "E3", noteStyle)
	f.MergeCell(sheetGrosir, "A3", "E3")

	for _, col := range []string{"A", "B", "C", "D", "E"} {
		f.SetColWidth(sheetGrosir, col, col, 20)
	}

	// ── Sheet 3: Kategori ────────────────────────────────────────────────────
	sheetKategori := "Kategori"
	f.NewSheet(sheetKategori)
	f.SetCellValue(sheetKategori, "A1", "nama_kategori")

	catHeaderStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#E2EFDA"}, Pattern: 1},
	})
	f.SetCellStyle(sheetKategori, "A1", "A1", catHeaderStyle)
	for i, name := range categoryNames {
		cell, _ := excelize.CoordinatesToCellName(1, i+2)
		f.SetCellValue(sheetKategori, cell, name)
	}
	f.SetColWidth(sheetKategori, "A", "A", 24)

	// ── Sheet 4: Satuan ──────────────────────────────────────────────────────
	sheetSatuan := "Satuan"
	f.NewSheet(sheetSatuan)
	f.SetCellValue(sheetSatuan, "A1", "nama_satuan")
	f.SetCellStyle(sheetSatuan, "A1", "A1", catHeaderStyle)
	for i, name := range unitNames {
		cell, _ := excelize.CoordinatesToCellName(1, i+2)
		f.SetCellValue(sheetSatuan, cell, name)
	}
	f.SetColWidth(sheetSatuan, "A", "A", 20)

	// Aktifkan sheet Produk saat dibuka
	if idx, err := f.GetSheetIndex(sheetProduk); err == nil {
		f.SetActiveSheet(idx)
	}

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename=template_import_produk.xlsx")

	if err := f.Write(c.Writer); err != nil {
		c.Error(&errors.InternalServerError{Message: "Gagal generate template"})
	}
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
