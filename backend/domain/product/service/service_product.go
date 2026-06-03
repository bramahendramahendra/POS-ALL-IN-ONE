package service_product

import (
	"crypto/rand"
	"fmt"
	"math"
	"math/big"
	"mime/multipart"
	"strconv"
	"strings"

	repo_category "pos_api/domain/product_category/repo"
	dto_product "pos_api/domain/product/dto"
	model_product "pos_api/domain/product/model"
	repo_product "pos_api/domain/product/repo"
	repo_unit "pos_api/domain/product_unit/repo"
	"pos_api/errors"

	"github.com/xuri/excelize/v2"
)

type productService struct {
	repo           repo_product.ProductRepo
	catRepo        repo_category.CategoryRepo
	packageRepo    repo_product.ProductPackageRepo
	masterUnitRepo repo_unit.UnitRepo
}

func NewProductService(
	repo repo_product.ProductRepo,
	catRepo repo_category.CategoryRepo,
	packageRepo repo_product.ProductPackageRepo,
	masterUnitRepo repo_unit.UnitRepo,
) ProductService {
	return &productService{repo: repo, catRepo: catRepo, packageRepo: packageRepo, masterUnitRepo: masterUnitRepo}
}

func (s *productService) GetCategoryNames() ([]string, error) {
	cats, err := s.catRepo.GetAll()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	names := make([]string, 0, len(cats))
	for _, c := range cats {
		names = append(names, c.Name)
	}
	return names, nil
}

func (s *productService) GetUnitNames() ([]string, error) {
	units, err := s.masterUnitRepo.GetActive()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	names := make([]string, 0, len(units))
	for _, u := range units {
		names = append(names, u.Name)
	}
	return names, nil
}

func (s *productService) GetUnitInfos() ([]*dto_product.UnitInfo, error) {
	units, err := s.masterUnitRepo.GetActive()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	infos := make([]*dto_product.UnitInfo, 0, len(units))
	for _, u := range units {
		infos = append(infos, &dto_product.UnitInfo{Name: u.Name, Abbreviation: u.Abbreviation})
	}
	return infos, nil
}

func (s *productService) GetAll(filter *dto_product.ProductFilter) ([]*dto_product.ProductResponse, int, error) {
	products, total, err := s.repo.GetAll(filter)
	if err != nil {
		return nil, 0, &errors.InternalServerError{Message: err.Error()}
	}
	return products, total, nil
}

func (s *productService) GetByID(id int) (*dto_product.ProductResponse, error) {
	p, err := s.repo.GetByID(id)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if p == nil {
		return nil, &errors.NotFoundError{Message: "Produk tidak ditemukan"}
	}
	return toProductResponse(p, ""), nil
}

func (s *productService) GetByBarcode(barcode string) (*dto_product.ProductResponse, error) {
	p, err := s.repo.GetByBarcode(barcode)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if p == nil {
		return nil, &errors.NotFoundError{Message: "Produk tidak ditemukan"}
	}
	return toProductResponse(p, ""), nil
}

func (s *productService) Search(keyword string, limit int) ([]*dto_product.ProductSearchResult, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}
	results, err := s.repo.Search(keyword, limit)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return results, nil
}

func (s *productService) GetLowStock() ([]*dto_product.LowStockProduct, error) {
	results, err := s.repo.GetLowStock()
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	return results, nil
}

func (s *productService) GenerateBarcode() (*dto_product.GenerateBarcodeResponse, error) {
	// EAN-13 dengan prefix 899 (Indonesia)
	digits := make([]int, 12)
	digits[0], digits[1], digits[2] = 8, 9, 9
	for i := 3; i < 12; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return nil, &errors.InternalServerError{Message: "Gagal generate barcode"}
		}
		digits[i] = int(n.Int64())
	}
	// Hitung checksum EAN-13
	sum := 0
	for i, d := range digits {
		if i%2 == 0 {
			sum += d
		} else {
			sum += d * 3
		}
	}
	checksum := (10 - (sum % 10)) % 10

	barcode := ""
	for _, d := range digits {
		barcode += strconv.Itoa(d)
	}
	barcode += strconv.Itoa(checksum)

	return &dto_product.GenerateBarcodeResponse{Barcode: barcode}, nil
}

func (s *productService) GenerateSku(categoryID int) (*dto_product.GenerateSkuResponse, error) {
	cat, err := s.catRepo.GetByID(categoryID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if cat == nil {
		return nil, &errors.NotFoundError{Message: "Kategori tidak ditemukan"}
	}

	count, err := s.repo.CountSkuByCategory(categoryID)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	sku := fmt.Sprintf("%s-%04d", cat.Code, count+1)
	return &dto_product.GenerateSkuResponse{SKU: sku}, nil
}

func (s *productService) Create(req *dto_product.ProductRequest) (*dto_product.ProductResponse, error) {
	exists, err := s.repo.CheckBarcodeExists(req.Barcode, 0)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if exists {
		return nil, &errors.BadRequestError{Message: "Barcode sudah digunakan"}
	}

	skuExists, err := s.repo.CheckSkuExists(req.SKU, 0)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}
	if skuExists {
		return nil, &errors.BadRequestError{Message: "SKU sudah digunakan"}
	}

	newID, err := s.repo.Create(req)
	if err != nil {
		return nil, &errors.InternalServerError{Message: err.Error()}
	}

	created, err := s.repo.GetByID(int(newID))
	if err != nil || created == nil {
		return nil, &errors.InternalServerError{Message: "Gagal mengambil data produk baru"}
	}
	return toProductResponse(created, ""), nil
}

func (s *productService) Update(id int, req *dto_product.ProductRequest) error {
	p, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if p == nil {
		return &errors.NotFoundError{Message: "Produk tidak ditemukan"}
	}

	exists, err := s.repo.CheckBarcodeExists(req.Barcode, id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if exists {
		return &errors.BadRequestError{Message: "Barcode sudah digunakan"}
	}

	skuExists, err := s.repo.CheckSkuExists(req.SKU, id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if skuExists {
		return &errors.BadRequestError{Message: "SKU sudah digunakan"}
	}

	return s.repo.Update(id, req)
}

func (s *productService) Delete(id int) error {
	p, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if p == nil {
		return &errors.NotFoundError{Message: "Produk tidak ditemukan"}
	}

	count, err := s.repo.CountTransactionItems(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if count > 0 {
		return &errors.BadRequestError{Message: "Produk tidak bisa dihapus karena sudah ada di transaksi"}
	}

	return s.repo.Delete(id)
}

func (s *productService) ToggleStatus(id int) error {
	p, err := s.repo.GetByID(id)
	if err != nil {
		return &errors.InternalServerError{Message: err.Error()}
	}
	if p == nil {
		return &errors.NotFoundError{Message: "Produk tidak ditemukan"}
	}
	return s.repo.ToggleStatus(id)
}

func (s *productService) ImportFromFile(file *multipart.FileHeader) (*dto_product.ImportResult, error) {
	src, err := file.Open()
	if err != nil {
		return nil, &errors.InternalServerError{Message: "Gagal membuka file"}
	}
	defer src.Close()

	f, err := excelize.OpenReader(src)
	if err != nil {
		return nil, &errors.BadRequestError{Message: "File tidak dapat dibaca sebagai Excel"}
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, &errors.BadRequestError{Message: "File tidak memiliki sheet"}
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return nil, &errors.InternalServerError{Message: "Gagal membaca baris file"}
	}

	result := &dto_product.ImportResult{Errors: []dto_product.ImportErrorDetail{}}

	if len(rows) <= 1 {
		return result, nil
	}

	for i, row := range rows[1:] {
		rowNum := i + 2

		getCol := func(idx int) string {
			if idx < len(row) {
				return strings.TrimSpace(row[idx])
			}
			return ""
		}

		name := getCol(0)
		sellingPriceStr := getCol(4)

		if name == "" || sellingPriceStr == "" {
			result.Failed++
			result.Errors = append(result.Errors, dto_product.ImportErrorDetail{
				Row:     rowNum,
				Message: "Kolom name dan selling_price wajib diisi",
			})
			continue
		}

		sellingPrice, err := strconv.ParseFloat(sellingPriceStr, 64)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, dto_product.ImportErrorDetail{
				Row:     rowNum,
				Message: fmt.Sprintf("selling_price tidak valid: %s", sellingPriceStr),
			})
			continue
		}

		req := &dto_product.ProductRequest{
			Barcode:      getCol(1),
			Name:         name,
			SellingPrice: sellingPrice,
		}

		if v := getCol(3); v != "" {
			if pp, err := strconv.ParseFloat(v, 64); err == nil {
				req.PurchasePrice = pp
			}
		}
		if v := getCol(5); v != "" {
			if st, err := strconv.ParseFloat(v, 64); err == nil {
				req.Stock = st
			}
		}
		if v := getCol(6); v != "" {
			if ms, err := strconv.ParseFloat(v, 64); err == nil {
				req.MinStock = ms
			}
		}

		if categoryName := getCol(2); categoryName != "" {
			cat, err := s.catRepo.GetByName(categoryName)
			if err != nil {
				result.Failed++
				result.Errors = append(result.Errors, dto_product.ImportErrorDetail{
					Row:     rowNum,
					Message: fmt.Sprintf("Gagal mencari kategori: %s", categoryName),
				})
				continue
			}
			if cat == nil {
				newID, err := s.catRepo.CreateWithGeneratedCode(categoryName, "")
				if err != nil {
					result.Failed++
					result.Errors = append(result.Errors, dto_product.ImportErrorDetail{
						Row:     rowNum,
						Message: fmt.Sprintf("Gagal membuat kategori: %s", categoryName),
					})
					continue
				}
				id := int(newID)
				req.CategoryID = &id
			} else {
				req.CategoryID = &cat.ID
			}
		}

		if req.Barcode != "" {
			exists, err := s.repo.CheckBarcodeExists(req.Barcode, 0)
			if err != nil {
				result.Failed++
				result.Errors = append(result.Errors, dto_product.ImportErrorDetail{
					Row:     rowNum,
					Message: "Gagal memeriksa barcode",
				})
				continue
			}
			if exists {
				result.Failed++
				result.Errors = append(result.Errors, dto_product.ImportErrorDetail{
					Row:     rowNum,
					Message: fmt.Sprintf("Barcode sudah digunakan: %s", req.Barcode),
				})
				continue
			}
		}

		if _, err := s.repo.Create(req); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, dto_product.ImportErrorDetail{
				Row:     rowNum,
				Message: "Gagal menyimpan produk",
			})
			continue
		}

		result.Success++
	}

	return result, nil
}

func (s *productService) ImportBulk(bulkReq dto_product.BulkImportRequest) (*dto_product.BulkImportResult, error) {
	result := &dto_product.BulkImportResult{
		Failed: []dto_product.BulkImportFailed{},
	}

	// noToProductID maps the Excel row "no" to the saved product ID for grosir cross-reference
	noToProductID := make(map[int]int)
	// defaultPackages menyimpan default package per productID, dikumpulkan dulu sebelum disimpan
	defaultPackages := make(map[int]dto_product.ProductPackageRequest)

	for i, row := range bulkReq.Rows {
		rowNum := i + 2

		addFailed := func(alasan string) {
			result.Failed = append(result.Failed, dto_product.BulkImportFailed{
				Baris:  rowNum,
				Data:   row,
				Alasan: alasan,
			})
		}

		if strings.TrimSpace(row.Nama) == "" {
			addFailed("Nama produk kosong")
			continue
		}

		// Resolve unit_id dari nama atau singkatan satuan
		satuanKey := strings.ToLower(strings.TrimSpace(row.Satuan))
		if satuanKey == "" {
			addFailed("Satuan kosong")
			continue
		}
		resolvedUnitID := row.SatuanID // sudah di-resolve saat ImportPreview
		if resolvedUnitID == 0 {
			addFailed(fmt.Sprintf("Satuan \"%s\" tidak ditemukan di master data", row.Satuan))
			continue
		}

		req := &dto_product.ProductRequest{
			Barcode:       strings.TrimSpace(row.Barcode),
			Name:          strings.TrimSpace(row.Nama),
			PurchasePrice: row.HargaBeli,
			SellingPrice:  row.HargaJual,
			Stock:         row.Stok,
			MinStock:      row.StokMinimum,
			UnitID:        resolvedUnitID,
		}

		kategori := strings.TrimSpace(row.Kategori)
		if kategori != "" {
			cat, err := s.catRepo.GetByName(kategori)
			if err != nil {
				addFailed(fmt.Sprintf("Gagal mencari kategori: %s", kategori))
				continue
			}
			if cat == nil {
				newID, err := s.catRepo.CreateWithGeneratedCode(kategori, "")
				if err != nil {
					addFailed(fmt.Sprintf("Gagal membuat kategori: %s", kategori))
					continue
				}
				id := int(newID)
				req.CategoryID = &id
			} else {
				req.CategoryID = &cat.ID
			}
		}

		// Auto-generate barcode jika kosong
		if req.Barcode == "" {
			gen, err := s.GenerateBarcode()
			if err != nil {
				addFailed("Gagal generate barcode")
				continue
			}
			req.Barcode = gen.Barcode
		} else {
			exists, err := s.repo.CheckBarcodeExists(req.Barcode, 0)
			if err != nil {
				addFailed("Gagal memeriksa barcode")
				continue
			}
			if exists {
				addFailed(fmt.Sprintf("Barcode sudah digunakan: %s", req.Barcode))
				continue
			}
		}

		// Auto-generate SKU dari kategori
		if req.CategoryID != nil {
			skuResp, err := s.GenerateSku(*req.CategoryID)
			if err == nil {
				req.SKU = skuResp.SKU
			}
		}

		productID, err := s.repo.Create(req)
		if err != nil {
			addFailed("Gagal menyimpan produk")
			continue
		}

		if row.No > 0 {
			noToProductID[row.No] = int(productID)
		}

		// Catat default package per productID — belum disimpan, dikumpulkan dulu
		// agar tidak ada dua kali Save untuk produk yang juga punya grosir
		defaultPackages[int(productID)] = dto_product.ProductPackageRequest{
			UnitID:        resolvedUnitID,
			ConversionQty: 1,
			PurchasePrice: row.HargaBeli,
			SellingPrice:  row.HargaJual,
			IsDefault:     true,
		}

		result.Success++
	}

	// Kumpulkan grosir per productID
	grosirByProduct := make(map[int][]dto_product.ProductPackageRequest)
	for _, g := range bulkReq.Grosir {
		productID, ok := noToProductID[g.NoProduk]
		if !ok || g.SatuanID == 0 {
			continue
		}
		grosirByProduct[productID] = append(grosirByProduct[productID], dto_product.ProductPackageRequest{
			UnitID:        g.SatuanID,
			PackageName:   strings.TrimSpace(g.NamaPaket),
			ConversionQty: g.Konversi,
			PurchasePrice: g.HargaBeli,
			SellingPrice:  g.HargaJual,
			IsDefault:     false,
		})
	}

	// Simpan packages sekali per produk: default dulu, baru grosir (jika ada)
	for productID, defaultPkg := range defaultPackages {
		allPkgs := []dto_product.ProductPackageRequest{defaultPkg}
		if grosirPkgs, ok := grosirByProduct[productID]; ok {
			allPkgs = append(allPkgs, grosirPkgs...)
		}
		_ = s.packageRepo.Save(productID, allPkgs)
	}

	return result, nil
}

func (s *productService) ImportPreview(file *multipart.FileHeader) (*dto_product.ImportPreviewResponse, error) {
	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("Gagal membuka file")
	}
	defer src.Close()

	f, err := excelize.OpenReader(src)
	if err != nil {
		return nil, fmt.Errorf("Gagal membaca file Excel")
	}
	defer f.Close()

	// Fetch master data untuk validasi
	validCategories := make(map[string]bool)
	if cats, err := s.catRepo.GetAll(); err == nil {
		for _, c := range cats {
			validCategories[strings.ToLower(strings.TrimSpace(c.Name))] = true
		}
	}

	// unitIDMap: key = lowercase nama/singkatan → unit_id
	unitIDMap := make(map[string]int)
	if units, err := s.masterUnitRepo.GetAll(); err == nil {
		for _, u := range units {
			unitIDMap[strings.ToLower(strings.TrimSpace(u.Name))] = u.ID
			unitIDMap[strings.ToLower(strings.TrimSpace(u.Abbreviation))] = u.ID
		}
	}

	// Parse sheet Produk
	sheetProduk := "Produk"
	if idx, _ := f.GetSheetIndex(sheetProduk); idx == -1 {
		sheetProduk = f.GetSheetName(0)
	}
	produkRows, err := f.GetRows(sheetProduk)
	if err != nil || len(produkRows) < 2 {
		return &dto_product.ImportPreviewResponse{
			Rows:   []dto_product.ImportPreviewRow{},
			Grosir: []dto_product.ImportPreviewGrosirRow{},
		}, nil
	}

	headerProduk := produkRows[0]
	colIdx := func(headers []string, name string) int {
		for i, h := range headers {
			if strings.EqualFold(strings.TrimSpace(h), name) {
				return i
			}
		}
		return -1
	}
	getCell := func(row []string, idx int) string {
		if idx < 0 || idx >= len(row) {
			return ""
		}
		return strings.TrimSpace(row[idx])
	}
	toFloat := func(s string) float64 {
		// excelize memformat NumFmt 3 (#,##0) dengan koma sebagai pemisah ribuan: "20,000"
		// Hapus koma agar "20,000" → "20000" sebelum di-parse
		s = strings.ReplaceAll(s, ",", "")
		v, _ := strconv.ParseFloat(s, 64)
		return v
	}
	toInt := func(s string) int {
		v, _ := strconv.Atoi(s)
		return v
	}

	// Urutan kolom: No, Produk, Barcode, Kategori, Harga Beli, Harga Jual, Margin(*), Stok, Stok Minimum, Satuan
	// (*) Margin diabaikan — kolom formula, tidak dibaca
	colNo := colIdx(headerProduk, "No")
	colNama := colIdx(headerProduk, "Produk")
	colBarcode := colIdx(headerProduk, "Barcode")
	colKategori := colIdx(headerProduk, "Kategori")
	colHargaBeli := colIdx(headerProduk, "Harga Beli")
	colHargaJual := colIdx(headerProduk, "Harga Jual")
	colStok := colIdx(headerProduk, "Stok")
	colStokMin := colIdx(headerProduk, "Stok Minimum")
	colSatuan := colIdx(headerProduk, "Satuan")

	seenBarcodes := make(map[string]bool)
	validNos := make(map[int]bool)

	var previewRows []dto_product.ImportPreviewRow
	for _, row := range produkRows[1:] {
		no := toInt(getCell(row, colNo))
		if no <= 0 {
			continue
		}

		errs := []string{}
		warns := []string{}

		nama := getCell(row, colNama)
		barcode := getCell(row, colBarcode)
		kategori := getCell(row, colKategori)
		satuan := getCell(row, colSatuan)
		hargaBeli := toFloat(getCell(row, colHargaBeli))
		hargaJual := toFloat(getCell(row, colHargaJual))
		stok := toFloat(getCell(row, colStok))
		stokMin := toFloat(getCell(row, colStokMin))

		// Validasi wajib
		if nama == "" {
			errs = append(errs, "Nama produk wajib diisi")
		}
		satuanID := unitIDMap[strings.ToLower(satuan)]
		if satuan == "" {
			errs = append(errs, "Satuan wajib diisi")
		} else if satuanID == 0 {
			errs = append(errs, fmt.Sprintf("Satuan \"%s\" tidak ditemukan di master data", satuan))
		}
		if hargaJual <= 0 {
			errs = append(errs, "Harga jual harus lebih dari 0")
		}
		if hargaJual > 0 && hargaBeli > 0 && hargaJual < hargaBeli {
			errs = append(errs, "Harga jual tidak boleh lebih rendah dari harga beli")
		}
		if stok < 0 {
			errs = append(errs, "Stok tidak boleh negatif")
		}
		if stokMin < 0 {
			errs = append(errs, "Stok minimum tidak boleh negatif")
		}

		// Validasi kategori
		if kategori == "" {
			warns = append(warns, "Kategori kosong — produk akan masuk tanpa kategori")
		} else if !validCategories[strings.ToLower(kategori)] {
			errs = append(errs, fmt.Sprintf("Kategori \"%s\" tidak ditemukan di master data", kategori))
		}

		// Validasi & generate barcode
		if barcode == "" {
			gen, genErr := s.GenerateBarcode()
			if genErr == nil {
				barcode = gen.Barcode
				warns = append(warns, "Barcode kosong — di-generate otomatis")
			} else {
				errs = append(errs, "Gagal generate barcode")
			}
		} else {
			barcodeKey := strings.ToLower(barcode)
			if seenBarcodes[barcodeKey] {
				errs = append(errs, fmt.Sprintf("Barcode \"%s\" duplikat dalam file", barcode))
			} else {
				exists, checkErr := s.repo.CheckBarcodeExists(barcode, 0)
				if checkErr == nil && exists {
					errs = append(errs, fmt.Sprintf("Barcode \"%s\" sudah digunakan produk lain", barcode))
				}
			}
		}
		seenBarcodes[strings.ToLower(barcode)] = true

		valid := len(errs) == 0
		if valid {
			validNos[no] = true
		}

		margin := 0
		if hargaJual > 0 && hargaBeli >= 0 {
			margin = int(math.Round(((hargaJual - hargaBeli) / hargaJual) * 100))
		}

		previewRows = append(previewRows, dto_product.ImportPreviewRow{
			No:          no,
			Nama:        nama,
			Barcode:     barcode,
			Kategori:    kategori,
			HargaBeli:   hargaBeli,
			HargaJual:   hargaJual,
			Margin:      margin,
			Stok:        stok,
			StokMinimum: stokMin,
			Satuan:      satuan,
			SatuanID:    satuanID,
			Valid:        valid,
			Errors:      errs,
			Warnings:    warns,
		})
	}

	// Parse sheet Grosir
	sheetGrosir := "Grosir"
	if idx, _ := f.GetSheetIndex(sheetGrosir); idx == -1 {
		sheetGrosir = f.GetSheetName(1)
	}
	grosirRows, _ := f.GetRows(sheetGrosir)

	var previewGrosir []dto_product.ImportPreviewGrosirRow
	if len(grosirRows) >= 2 {
		headerGrosir := grosirRows[0]
		// Urutan kolom: No Produk, Nama Paket, Satuan, Konversi, Ref Harga Beli(*), Harga Beli, Ref Harga Jual(*), Harga Jual
		// (*) Ref diabaikan — kolom formula, tidak dibaca
		gColNoProduk := colIdx(headerGrosir, "No Produk")
		gColNamaPaket := colIdx(headerGrosir, "Nama Paket")
		gColSatuan := colIdx(headerGrosir, "Satuan")
		gColKonversi := colIdx(headerGrosir, "Konversi")
		gColHargaBeli := colIdx(headerGrosir, "Harga Beli")
		gColHargaJual := colIdx(headerGrosir, "Harga Jual")

		for _, row := range grosirRows[1:] {
			noProduk := toInt(getCell(row, gColNoProduk))
			if noProduk <= 0 {
				continue
			}
			errs := []string{}
			namaPaket := getCell(row, gColNamaPaket)
			satuan := getCell(row, gColSatuan)
			konversi := toFloat(getCell(row, gColKonversi))
			hargaBeli := toFloat(getCell(row, gColHargaBeli))
			hargaJual := toFloat(getCell(row, gColHargaJual))

			if !validNos[noProduk] {
				errs = append(errs, fmt.Sprintf("No produk %d tidak ditemukan atau tidak valid di sheet Produk", noProduk))
			}
			satuanID := unitIDMap[strings.ToLower(satuan)]
			if satuan == "" {
				errs = append(errs, "Satuan wajib diisi")
			} else if satuanID == 0 {
				errs = append(errs, fmt.Sprintf("Satuan \"%s\" tidak ditemukan di master data", satuan))
			}
			if konversi <= 0 {
				errs = append(errs, "Konversi harus lebih dari 0")
			}
			if hargaJual <= 0 {
				errs = append(errs, "Harga jual harus lebih dari 0")
			}

			previewGrosir = append(previewGrosir, dto_product.ImportPreviewGrosirRow{
				NoProduk:  noProduk,
				NamaPaket: namaPaket,
				Satuan:    satuan,
				SatuanID:  satuanID,
				Konversi:  konversi,
				HargaBeli: hargaBeli,
				HargaJual: hargaJual,
				Valid:      len(errs) == 0,
				Errors:    errs,
			})
		}
	}

	if previewRows == nil {
		previewRows = []dto_product.ImportPreviewRow{}
	}
	if previewGrosir == nil {
		previewGrosir = []dto_product.ImportPreviewGrosirRow{}
	}

	return &dto_product.ImportPreviewResponse{
		Rows:   previewRows,
		Grosir: previewGrosir,
	}, nil
}

func toProductResponse(p *model_product.Product, categoryName string) *dto_product.ProductResponse {
	catName := categoryName
	if catName == "" {
		catName = p.CategoryName
	}
	return &dto_product.ProductResponse{
		ID:               p.ID,
		Barcode:          p.Barcode,
		SKU:              p.SKU,
		Name:             p.Name,
		CategoryID:       p.CategoryID,
		CategoryName:     catName,
		PurchasePrice:    p.PurchasePrice,
		SellingPrice:     p.SellingPrice,
		Stock:            p.Stock,
		MinStock:         p.MinStock,
		UnitID:           p.UnitID,
		UnitName:         p.UnitName,
		UnitAbbreviation: p.UnitAbbreviation,
		IsActive:         p.IsActive,
	}
}
