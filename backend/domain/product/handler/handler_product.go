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

	prodHeaders := []string{"no", "nama", "deskripsi", "barcode", "kategori", "harga_beli", "harga_jual", "stok", "stok_minimum", "satuan", "margin"}
	prodExample := []any{0, "Contoh Produk A", "Deskripsi opsional", "", "Minuman", 5000, 7000, 100, 10, "pcs"}

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
	// Kolom margin: read-only, latar abu, teks gelap, format 0%
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
	f.SetCellStyle(sheetProduk, "A1", "J1", headerStyle)
	f.SetCellStyle(sheetProduk, "K1", "K1", marginHeaderStyle)

	// Format uang: harga_beli (F) dan harga_jual (G)
	f.SetCellStyle(sheetProduk, "F2", "F1000", currencyStyle)
	f.SetCellStyle(sheetProduk, "G2", "G1000", currencyStyle)

	// Kolom K (margin): formula otomatis, read-only, format persentase
	// Rumus: =IFERROR(ROUND(((harga_jual-harga_beli)/harga_jual)*100,0),0)
	f.SetCellStyle(sheetProduk, "K2", "K1000", marginCellStyle)
	for row := 2; row <= 1000; row++ {
		cellK, _ := excelize.CoordinatesToCellName(11, row)
		f.SetCellFormula(sheetProduk, cellK, fmt.Sprintf(`IFERROR(ROUND(((G%d-F%d)/G%d)*100,0),0)`, row, row, row))
	}

	// Note baris 3
	f.SetCellValue(sheetProduk, "A3", "* no: nomor unik dalam file ini (dipakai sheet Grosir). barcode, deskripsi & margin (K) opsional/otomatis.")
	f.SetCellStyle(sheetProduk, "A3", "K3", noteStyle)
	f.MergeCell(sheetProduk, "A3", "K3")

	prodColWidths := map[string]float64{
		"A": 6, "B": 24, "C": 28, "D": 18, "E": 20,
		"F": 14, "G": 14, "H": 10, "I": 14, "J": 14, "K": 10,
	}
	for col, w := range prodColWidths {
		f.SetColWidth(sheetProduk, col, col, w)
	}

	// Kolom A (no): harus angka bulat >= 1
	dvNo := excelize.NewDataValidation(true)
	dvNo.Sqref = "A2:A1000"
	dvNo.SetRange(1, 999999, excelize.DataValidationTypeWhole, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvNo.SetError(excelize.DataValidationErrorStyleStop, "No tidak valid", "Kolom 'no' harus diisi dengan angka bulat minimal 1.")
	f.AddDataValidation(sheetProduk, dvNo)

	// Kolom B (nama): panjang teks 1–200 karakter
	dvNama := excelize.NewDataValidation(true)
	dvNama.Sqref = "B2:B1000"
	dvNama.SetRange(1, 200, excelize.DataValidationTypeTextLength, excelize.DataValidationOperatorBetween)
	dvNama.SetError(excelize.DataValidationErrorStyleStop, "Nama tidak valid", "Nama produk wajib diisi, maksimal 200 karakter.")
	f.AddDataValidation(sheetProduk, dvNama)

	// Kolom D (barcode): panjang teks maks 100 karakter
	dvBarcode := excelize.NewDataValidation(true)
	dvBarcode.Sqref = "D2:D1000"
	dvBarcode.SetRange(0, 100, excelize.DataValidationTypeTextLength, excelize.DataValidationOperatorBetween)
	dvBarcode.SetError(excelize.DataValidationErrorStyleStop, "Barcode tidak valid", "Barcode maksimal 100 karakter. Kosongkan jika ingin di-generate otomatis.")
	f.AddDataValidation(sheetProduk, dvBarcode)

	// Dropdown kategori (kolom E) referensi Kategori!$A$2:$A$N
	if len(categoryNames) > 0 {
		lastCatRow := len(categoryNames) + 1
		dvKategori := excelize.NewDataValidation(true)
		dvKategori.Sqref = "E2:E1000"
		dvKategori.Formula1 = fmt.Sprintf("Kategori!$A$2:$A$%d", lastCatRow)
		dvKategori.ShowDropDown = true
		dvKategori.SetError(excelize.DataValidationErrorStyleStop, "Kategori tidak valid", "Pilih kategori dari daftar yang tersedia di sheet Kategori.")
		f.AddDataValidation(sheetProduk, dvKategori)
	}

	// Kolom F (harga_beli): angka desimal >= 0
	dvHargaBeli := excelize.NewDataValidation(true)
	dvHargaBeli.Sqref = "F2:F1000"
	dvHargaBeli.SetRange(0, 9999999999999.99, excelize.DataValidationTypeDecimal, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvHargaBeli.SetError(excelize.DataValidationErrorStyleStop, "Harga beli tidak valid", "Harga beli harus berupa angka >= 0.")
	f.AddDataValidation(sheetProduk, dvHargaBeli)

	// Kolom G (harga_jual): angka desimal > 0
	dvHargaJual := excelize.NewDataValidation(true)
	dvHargaJual.Sqref = "G2:G1000"
	dvHargaJual.SetRange(0.01, 9999999999999.99, excelize.DataValidationTypeDecimal, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvHargaJual.SetError(excelize.DataValidationErrorStyleStop, "Harga jual tidak valid", "Harga jual harus berupa angka > 0.")
	f.AddDataValidation(sheetProduk, dvHargaJual)

	// Kolom H (stok): angka desimal >= 0
	dvStok := excelize.NewDataValidation(true)
	dvStok.Sqref = "H2:H1000"
	dvStok.SetRange(0, 9999999999999.999, excelize.DataValidationTypeDecimal, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvStok.SetError(excelize.DataValidationErrorStyleStop, "Stok tidak valid", "Stok harus berupa angka >= 0.")
	f.AddDataValidation(sheetProduk, dvStok)

	// Kolom I (stok_minimum): angka desimal >= 0
	dvStokMin := excelize.NewDataValidation(true)
	dvStokMin.Sqref = "I2:I1000"
	dvStokMin.SetRange(0, 9999999999999.999, excelize.DataValidationTypeDecimal, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvStokMin.SetError(excelize.DataValidationErrorStyleStop, "Stok minimum tidak valid", "Stok minimum harus berupa angka >= 0.")
	f.AddDataValidation(sheetProduk, dvStokMin)

	// Dropdown satuan (kolom J) referensi Satuan!$A$2:$A$N
	if len(unitInfos) > 0 {
		lastUnitRow := len(unitInfos) + 1
		dvSatuan := excelize.NewDataValidation(true)
		dvSatuan.Sqref = "J2:J1000"
		dvSatuan.Formula1 = fmt.Sprintf("Satuan!$A$2:$A$%d", lastUnitRow)
		dvSatuan.ShowDropDown = true
		dvSatuan.SetError(excelize.DataValidationErrorStyleStop, "Satuan tidak valid", "Pilih satuan dari daftar yang tersedia di sheet Satuan.")
		f.AddDataValidation(sheetProduk, dvSatuan)
	}

	// ── Sheet 2: Grosir ──────────────────────────────────────────────────────
	sheetGrosir := "Grosir"
	f.NewSheet(sheetGrosir)

	grosirHeaders := []string{"no_produk", "nama_paket", "konversi", "harga_beli", "harga_jual", "ref_harga_beli", "ref_harga_jual"}
	grosirExample := []any{0, "Dus (12 pcs)", 12, 55000, 75000}

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
	// Header: kolom input biru, kolom ref abu-abu
	f.SetCellStyle(sheetGrosir, "A1", "E1", headerStyle)
	f.SetCellStyle(sheetGrosir, "F1", "G1", refHeaderStyle)

	// Format uang: harga_beli (D) dan harga_jual (E)
	f.SetCellStyle(sheetGrosir, "D2", "D500", grosirCurrencyStyle)
	f.SetCellStyle(sheetGrosir, "E2", "E500", grosirCurrencyStyle)

	// Formula VLOOKUP ref untuk baris data (2–501)
	f.SetCellStyle(sheetGrosir, "F2", "G501", refCellStyle)
	for row := 2; row <= 501; row++ {
		cellA, _ := excelize.CoordinatesToCellName(1, row)
		cellF, _ := excelize.CoordinatesToCellName(6, row)
		cellG, _ := excelize.CoordinatesToCellName(7, row)
		cellC, _ := excelize.CoordinatesToCellName(3, row)
		f.SetCellFormula(sheetGrosir, cellF, fmt.Sprintf(`IFERROR(VLOOKUP(%s,Produk!$A:$J,6,0)*%s,"")`, cellA, cellC))
		f.SetCellFormula(sheetGrosir, cellG, fmt.Sprintf(`IFERROR(VLOOKUP(%s,Produk!$A:$J,7,0)*%s,"")`, cellA, cellC))
	}

	f.SetCellValue(sheetGrosir, "A3", "* no_produk: isi dengan nilai kolom 'no' dari sheet Produk. Satu produk bisa punya banyak paket grosir.")
	f.SetCellStyle(sheetGrosir, "A3", "G3", noteStyle)
	f.MergeCell(sheetGrosir, "A3", "G3")

	// Kolom A (no_produk): angka bulat >= 1
	dvGNoProduk := excelize.NewDataValidation(true)
	dvGNoProduk.Sqref = "A2:A500"
	dvGNoProduk.SetRange(1, 999999, excelize.DataValidationTypeWhole, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvGNoProduk.SetError(excelize.DataValidationErrorStyleStop, "No produk tidak valid", "Isi dengan angka 'no' dari sheet Produk (bulat >= 1).")
	f.AddDataValidation(sheetGrosir, dvGNoProduk)

	// Kolom B (nama_paket): panjang teks 1–50 karakter
	dvGNamaPaket := excelize.NewDataValidation(true)
	dvGNamaPaket.Sqref = "B2:B500"
	dvGNamaPaket.SetRange(1, 50, excelize.DataValidationTypeTextLength, excelize.DataValidationOperatorBetween)
	dvGNamaPaket.SetError(excelize.DataValidationErrorStyleStop, "Nama paket tidak valid", "Nama paket wajib diisi, maksimal 50 karakter.")
	f.AddDataValidation(sheetGrosir, dvGNamaPaket)

	// Kolom C (konversi): angka desimal > 0
	dvGKonversi := excelize.NewDataValidation(true)
	dvGKonversi.Sqref = "C2:C500"
	dvGKonversi.SetRange(0.001, 9999999999999.999, excelize.DataValidationTypeDecimal, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvGKonversi.SetError(excelize.DataValidationErrorStyleStop, "Konversi tidak valid", "Konversi harus berupa angka > 0.")
	f.AddDataValidation(sheetGrosir, dvGKonversi)

	// Kolom D (harga_beli): angka desimal >= 0
	dvGHargaBeli := excelize.NewDataValidation(true)
	dvGHargaBeli.Sqref = "D2:D500"
	dvGHargaBeli.SetRange(0, 9999999999999.99, excelize.DataValidationTypeDecimal, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvGHargaBeli.SetError(excelize.DataValidationErrorStyleStop, "Harga beli tidak valid", "Harga beli harus berupa angka >= 0.")
	f.AddDataValidation(sheetGrosir, dvGHargaBeli)

	// Kolom E (harga_jual): angka desimal > 0
	dvGHargaJual := excelize.NewDataValidation(true)
	dvGHargaJual.Sqref = "E2:E500"
	dvGHargaJual.SetRange(0.01, 9999999999999.99, excelize.DataValidationTypeDecimal, excelize.DataValidationOperatorGreaterThanOrEqual)
	dvGHargaJual.SetError(excelize.DataValidationErrorStyleStop, "Harga jual tidak valid", "Harga jual harus berupa angka > 0.")
	f.AddDataValidation(sheetGrosir, dvGHargaJual)

	for _, col := range []string{"A", "B", "C", "D", "E"} {
		f.SetColWidth(sheetGrosir, col, col, 20)
	}
	f.SetColWidth(sheetGrosir, "F", "G", 18)

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
