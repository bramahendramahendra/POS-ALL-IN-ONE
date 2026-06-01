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

// POST /api/products/import-preview
func (h *ProductHandler) ImportPreview(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.Error(&errors.BadRequestError{Message: "File tidak ditemukan"})
		return
	}

	result, err := h.service.ImportPreview(file)
	if err != nil {
		c.Error(err)
		return
	}

	response_helper.WrapResponse(c, 200, "json", &global_dto.ResponseParams{
		Code:    helper.StatusOk,
		Status:  true,
		Message: "Preview berhasil",
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
	unitInfos, err := h.service.GetUnitInfos()
	if err != nil {
		c.Error(err)
		return
	}

	f := excelize.NewFile()
	defer f.Close()

	// ── Sheet 1: Produk ──────────────────────────────────────────────────────
	sheetProduk := "Produk"
	f.SetSheetName("Sheet1", sheetProduk)

	// Urutan: No, Produk, Barcode, Kategori, Harga Beli, Harga Jual, Margin, Stok, Stok Minimum, Satuan
	prodHeaders := []string{"No", "Produk", "Barcode", "Kategori", "Harga Beli", "Harga Jual", "Margin", "Stok", "Stok Minimum", "Satuan"}
	prodExample := []any{0, "Contoh Produk A", "", "Minuman", 5000, 7000, "", 100, 10, "pcs"}

	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "#FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#4472C4"}, Pattern: 1},
	})
	noteStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Italic: true, Color: "#7F7F7F", Size: 9},
	})
	// Format ribuan tanpa desimal: 1000 → 1.000 (mengikuti locale Excel user)
	currencyStyle, _ := f.NewStyle(&excelize.Style{
		NumFmt: 3, // built-in Excel format #,##0
	})
	// Kolom margin & ref: read-only, latar abu, teks gelap
	marginHeaderStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "#FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#808080"}, Pattern: 1},
	})
	marginCellStyle, _ := f.NewStyle(&excelize.Style{
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"#F2F2F2"}, Pattern: 1},
		Font:      &excelize.Font{Color: "#595959"},
		Alignment: &excelize.Alignment{Horizontal: "center"},
		NumFmt:    9, // built-in Excel format 0%
	})

	for col, h := range prodHeaders {
		cell, _ := excelize.CoordinatesToCellName(col+1, 1)
		f.SetCellValue(sheetProduk, cell, h)
	}
	for col, val := range prodExample {
		cell, _ := excelize.CoordinatesToCellName(col+1, 2)
		f.SetCellValue(sheetProduk, cell, val)
	}
	// A–F biru, G (Margin) abu, H–J biru
	f.SetCellStyle(sheetProduk, "A1", "F1", headerStyle)
	f.SetCellStyle(sheetProduk, "G1", "G1", marginHeaderStyle)
	f.SetCellStyle(sheetProduk, "H1", "J1", headerStyle)

	// Format uang: Harga Beli (E) dan Harga Jual (F)
	f.SetCellStyle(sheetProduk, "E2", "E1000", currencyStyle)
	f.SetCellStyle(sheetProduk, "F2", "F1000", currencyStyle)

	// Kolom G (Margin): formula otomatis, read-only, format persentase
	// Rumus: =IFERROR(ROUND((F-E)/F,2),0) — hasilnya desimal (misal 0.29), NumFmt 9 menampilkan sebagai 29%
	f.SetCellStyle(sheetProduk, "G2", "G1000", marginCellStyle)
	for row := 2; row <= 1000; row++ {
		cellG, _ := excelize.CoordinatesToCellName(7, row)
		f.SetCellFormula(sheetProduk, cellG, fmt.Sprintf(`IFERROR(ROUND((F%d-E%d)/F%d,2),0)`, row, row, row))
	}

	// Note baris 3
	f.SetCellValue(sheetProduk, "A3", "* No: nomor unik dalam file ini (dipakai sheet Grosir). Barcode opsional (di-generate otomatis jika kosong). Kolom Margin otomatis.")
	f.SetCellStyle(sheetProduk, "A3", "J3", noteStyle)
	f.MergeCell(sheetProduk, "A3", "J3")

	prodColWidths := map[string]float64{
		"A": 6, "B": 26, "C": 18, "D": 20,
		"E": 14, "F": 14, "G": 10, "H": 10, "I": 16, "J": 14,
	}
	for col, w := range prodColWidths {
		f.SetColWidth(sheetProduk, col, col, w)
	}

	// Kolom A (No): angka bulat >= 1
	dvNo := excelize.NewDataValidation(true)
	dvNo.Sqref = "A4:A1000"
	dvNo.SetRange(1, 999999, excelize.DataValidationTypeWhole, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvNo.SetError(excelize.DataValidationErrorStyleStop, "No tidak valid", "Kolom 'No' harus diisi dengan angka bulat minimal 1.")
	f.AddDataValidation(sheetProduk, dvNo)

	// Kolom B (Produk): panjang teks 1–200 karakter
	dvNama := excelize.NewDataValidation(true)
	dvNama.Sqref = "B4:B1000"
	dvNama.SetRange(1, 200, excelize.DataValidationTypeTextLength, excelize.DataValidationOperatorBetween)
	dvNama.SetError(excelize.DataValidationErrorStyleStop, "Nama tidak valid", "Nama produk wajib diisi, maksimal 200 karakter.")
	f.AddDataValidation(sheetProduk, dvNama)

	// Kolom C (Barcode): panjang teks maks 100 karakter
	dvBarcode := excelize.NewDataValidation(true)
	dvBarcode.Sqref = "C4:C1000"
	dvBarcode.SetRange(0, 100, excelize.DataValidationTypeTextLength, excelize.DataValidationOperatorBetween)
	dvBarcode.SetError(excelize.DataValidationErrorStyleStop, "Barcode tidak valid", "Barcode maksimal 100 karakter. Kosongkan jika ingin di-generate otomatis.")
	f.AddDataValidation(sheetProduk, dvBarcode)

	// Kolom D (Kategori): dropdown dari sheet Kategori
	if len(categoryNames) > 0 {
		lastCatRow := len(categoryNames) + 1
		dvKategori := excelize.NewDataValidation(true)
		dvKategori.Sqref = "D4:D1000"
		dvKategori.Formula1 = fmt.Sprintf("Kategori!$A$2:$A$%d", lastCatRow)
		dvKategori.ShowDropDown = true
		dvKategori.SetError(excelize.DataValidationErrorStyleStop, "Kategori tidak valid", "Pilih kategori dari daftar yang tersedia di sheet Kategori.")
		f.AddDataValidation(sheetProduk, dvKategori)
	}

	// Kolom E (Harga Beli): angka desimal >= 0
	dvHargaBeli := excelize.NewDataValidation(true)
	dvHargaBeli.Sqref = "E4:E1000"
	dvHargaBeli.SetRange(0, 9999999999999.99, excelize.DataValidationTypeDecimal, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvHargaBeli.SetError(excelize.DataValidationErrorStyleStop, "Harga beli tidak valid", "Harga beli harus berupa angka >= 0.")
	f.AddDataValidation(sheetProduk, dvHargaBeli)

	// Kolom F (Harga Jual): angka desimal > 0
	dvHargaJual := excelize.NewDataValidation(true)
	dvHargaJual.Sqref = "F4:F1000"
	dvHargaJual.SetRange(0.01, 9999999999999.99, excelize.DataValidationTypeDecimal, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvHargaJual.SetError(excelize.DataValidationErrorStyleStop, "Harga jual tidak valid", "Harga jual harus berupa angka > 0.")
	f.AddDataValidation(sheetProduk, dvHargaJual)

	// Kolom H (Stok): angka desimal >= 0
	dvStok := excelize.NewDataValidation(true)
	dvStok.Sqref = "H4:H1000"
	dvStok.SetRange(0, 9999999999999.999, excelize.DataValidationTypeDecimal, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvStok.SetError(excelize.DataValidationErrorStyleStop, "Stok tidak valid", "Stok harus berupa angka >= 0.")
	f.AddDataValidation(sheetProduk, dvStok)

	// Kolom I (Stok Minimum): angka desimal >= 0
	dvStokMin := excelize.NewDataValidation(true)
	dvStokMin.Sqref = "I4:I1000"
	dvStokMin.SetRange(0, 9999999999999.999, excelize.DataValidationTypeDecimal, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvStokMin.SetError(excelize.DataValidationErrorStyleStop, "Stok minimum tidak valid", "Stok minimum harus berupa angka >= 0.")
	f.AddDataValidation(sheetProduk, dvStokMin)

	// Kolom J (Satuan): dropdown dari sheet Satuan
	if len(unitInfos) > 0 {
		lastUnitRow := len(unitInfos) + 1
		dvSatuan := excelize.NewDataValidation(true)
		dvSatuan.Sqref = "J4:J1000"
		dvSatuan.Formula1 = fmt.Sprintf("Satuan!$A$2:$A$%d", lastUnitRow)
		dvSatuan.ShowDropDown = true
		dvSatuan.SetError(excelize.DataValidationErrorStyleStop, "Satuan tidak valid", "Pilih satuan dari daftar yang tersedia di sheet Satuan.")
		f.AddDataValidation(sheetProduk, dvSatuan)
	}

	// ── Sheet 2: Grosir ──────────────────────────────────────────────────────
	sheetGrosir := "Grosir"
	f.NewSheet(sheetGrosir)

	// Urutan: No Produk, Nama Paket, Satuan, Konversi, Ref Harga Beli, Harga Beli, Ref Harga Jual, Harga Jual
	grosirHeaders := []string{"No Produk", "Nama Paket", "Satuan", "Konversi", "Ref Harga Beli", "Harga Beli", "Ref Harga Jual", "Harga Jual"}
	grosirExample := []any{0, "1 Dus", "Dus", 12, "", 55000, "", 75000}

	refHeaderStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "#FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#808080"}, Pattern: 1},
	})
	refCellStyle, _ := f.NewStyle(&excelize.Style{
		Fill:   excelize.Fill{Type: "pattern", Color: []string{"#F2F2F2"}, Pattern: 1},
		Font:   &excelize.Font{Color: "#7F7F7F"},
		NumFmt: 3,
	})
	grosirCurrencyStyle, _ := f.NewStyle(&excelize.Style{
		NumFmt: 3,
	})

	for col, h := range grosirHeaders {
		cell, _ := excelize.CoordinatesToCellName(col+1, 1)
		f.SetCellValue(sheetGrosir, cell, h)
	}
	for col, val := range grosirExample {
		cell, _ := excelize.CoordinatesToCellName(col+1, 2)
		f.SetCellValue(sheetGrosir, cell, val)
	}
	// Header: A,B,C,D,F,H biru (input) — E,G abu (ref/otomatis)
	f.SetCellStyle(sheetGrosir, "A1", "D1", headerStyle)
	f.SetCellStyle(sheetGrosir, "E1", "E1", refHeaderStyle)
	f.SetCellStyle(sheetGrosir, "F1", "F1", headerStyle)
	f.SetCellStyle(sheetGrosir, "G1", "G1", refHeaderStyle)
	f.SetCellStyle(sheetGrosir, "H1", "H1", headerStyle)

	// Format uang: Harga Beli (F) dan Harga Jual (H)
	f.SetCellStyle(sheetGrosir, "F2", "F500", grosirCurrencyStyle)
	f.SetCellStyle(sheetGrosir, "H2", "H500", grosirCurrencyStyle)

	// Kolom E (Ref Harga Beli) dan G (Ref Harga Jual): formula VLOOKUP otomatis
	// Produk sheet kolom E=Harga Beli (index 5), F=Harga Jual (index 6)
	// VLOOKUP cari No Produk di kolom A sheet Produk, ambil kolom ke-5 (E=Harga Beli) atau ke-6 (F=Harga Jual)
	f.SetCellStyle(sheetGrosir, "E2", "E500", refCellStyle)
	f.SetCellStyle(sheetGrosir, "G2", "G500", refCellStyle)
	for row := 2; row <= 500; row++ {
		cellA, _ := excelize.CoordinatesToCellName(1, row)
		cellD, _ := excelize.CoordinatesToCellName(4, row)
		cellE, _ := excelize.CoordinatesToCellName(5, row)
		cellG, _ := excelize.CoordinatesToCellName(7, row)
		f.SetCellFormula(sheetGrosir, cellE, fmt.Sprintf(`IFERROR(VLOOKUP(%s,Produk!$A:$J,5,0)*%s,"")`, cellA, cellD))
		f.SetCellFormula(sheetGrosir, cellG, fmt.Sprintf(`IFERROR(VLOOKUP(%s,Produk!$A:$J,6,0)*%s,"")`, cellA, cellD))
	}

	f.SetCellValue(sheetGrosir, "A3", "* No Produk: isi dengan nilai kolom 'No' dari sheet Produk. Satuan dipilih dari dropdown. Kolom Ref otomatis.")
	f.SetCellStyle(sheetGrosir, "A3", "H3", noteStyle)
	f.MergeCell(sheetGrosir, "A3", "H3")

	// Kolom A (No Produk): angka bulat >= 1
	dvGNoProduk := excelize.NewDataValidation(true)
	dvGNoProduk.Sqref = "A4:A500"
	dvGNoProduk.SetRange(1, 999999, excelize.DataValidationTypeWhole, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvGNoProduk.SetError(excelize.DataValidationErrorStyleStop, "No produk tidak valid", "Isi dengan angka 'No' dari sheet Produk (bulat >= 1).")
	f.AddDataValidation(sheetGrosir, dvGNoProduk)

	// Kolom B (Nama Paket): panjang teks maks 100 karakter (opsional)
	dvGNamaPaket := excelize.NewDataValidation(true)
	dvGNamaPaket.Sqref = "B4:B500"
	dvGNamaPaket.SetRange(0, 100, excelize.DataValidationTypeTextLength, excelize.DataValidationOperatorBetween)
	dvGNamaPaket.SetError(excelize.DataValidationErrorStyleStop, "Nama paket tidak valid", "Nama paket maksimal 100 karakter.")
	f.AddDataValidation(sheetGrosir, dvGNamaPaket)

	// Kolom C (Satuan): dropdown dari sheet Satuan
	if len(unitInfos) > 0 {
		lastUnitRow := len(unitInfos) + 1
		dvGSatuan := excelize.NewDataValidation(true)
		dvGSatuan.Sqref = "C4:C500"
		dvGSatuan.Formula1 = fmt.Sprintf("Satuan!$A$2:$A$%d", lastUnitRow)
		dvGSatuan.ShowDropDown = true
		dvGSatuan.SetError(excelize.DataValidationErrorStyleStop, "Satuan tidak valid", "Pilih satuan dari daftar yang tersedia di sheet Satuan.")
		f.AddDataValidation(sheetGrosir, dvGSatuan)
	}

	// Kolom D (Konversi): angka desimal > 0
	dvGKonversi := excelize.NewDataValidation(true)
	dvGKonversi.Sqref = "D4:D500"
	dvGKonversi.SetRange(0.001, 9999999999999.999, excelize.DataValidationTypeDecimal, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvGKonversi.SetError(excelize.DataValidationErrorStyleStop, "Konversi tidak valid", "Konversi harus berupa angka > 0.")
	f.AddDataValidation(sheetGrosir, dvGKonversi)

	// Kolom F (Harga Beli): angka desimal >= 0
	dvGHargaBeli := excelize.NewDataValidation(true)
	dvGHargaBeli.Sqref = "F4:F500"
	dvGHargaBeli.SetRange(0, 9999999999999.99, excelize.DataValidationTypeDecimal, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvGHargaBeli.SetError(excelize.DataValidationErrorStyleStop, "Harga beli tidak valid", "Harga beli harus berupa angka >= 0.")
	f.AddDataValidation(sheetGrosir, dvGHargaBeli)

	// Kolom H (Harga Jual): angka desimal > 0
	dvGHargaJual := excelize.NewDataValidation(true)
	dvGHargaJual.Sqref = "H4:H500"
	dvGHargaJual.SetRange(0.01, 9999999999999.99, excelize.DataValidationTypeDecimal, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvGHargaJual.SetError(excelize.DataValidationErrorStyleStop, "Harga jual tidak valid", "Harga jual harus berupa angka > 0.")
	f.AddDataValidation(sheetGrosir, dvGHargaJual)

	for _, col := range []string{"A", "B", "C", "D", "F", "H"} {
		f.SetColWidth(sheetGrosir, col, col, 16)
	}
	for _, col := range []string{"E", "G"} {
		f.SetColWidth(sheetGrosir, col, col, 18)
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
	f.SetCellValue(sheetSatuan, "B1", "singkatan")
	f.SetCellStyle(sheetSatuan, "A1", "B1", catHeaderStyle)
	for i, u := range unitInfos {
		cellA, _ := excelize.CoordinatesToCellName(1, i+2)
		cellB, _ := excelize.CoordinatesToCellName(2, i+2)
		f.SetCellValue(sheetSatuan, cellA, u.Name)
		f.SetCellValue(sheetSatuan, cellB, u.Abbreviation)
	}
	f.SetColWidth(sheetSatuan, "A", "A", 20)
	f.SetColWidth(sheetSatuan, "B", "B", 14)

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
