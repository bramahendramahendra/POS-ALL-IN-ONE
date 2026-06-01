package dto_product

type ProductRequest struct {
	Barcode       string  `json:"barcode" validate:"required"`
	SKU           string  `json:"sku" validate:"required"`
	Name          string  `json:"name" validate:"required"`
	CategoryID    *int    `json:"category_id" validate:"required"`
	PurchasePrice float64 `json:"purchase_price" validate:"min=0"`
	SellingPrice  float64 `json:"selling_price" validate:"required,min=0"`
	Stock         float64 `json:"stock" validate:"min=0"`
	MinStock      float64 `json:"min_stock" validate:"min=0"`
	UnitID        int     `json:"unit_id" validate:"required,min=1"`
}

type ProductResponse struct {
	ID              int     `json:"id"`
	Barcode         string  `json:"barcode"`
	SKU             string  `json:"sku"`
	Name            string  `json:"name"`
	CategoryID      *int    `json:"category_id"`
	CategoryName    string  `json:"category_name"`
	PurchasePrice   float64 `json:"purchase_price"`
	SellingPrice    float64 `json:"selling_price"`
	Stock           float64 `json:"stock"`
	MinStock        float64 `json:"min_stock"`
	UnitID          int     `json:"unit_id"`
	UnitName        string  `json:"unit_name"`
	UnitAbbreviation string `json:"unit_abbreviation"`
	IsActive        bool    `json:"is_active"`
	ExtraPackages   int     `json:"extra_packages"`
	PriceTiersCount int     `json:"price_tiers_count"`
}

type GenerateBarcodeResponse struct {
	Barcode string `json:"barcode"`
}

type GenerateSkuResponse struct {
	SKU string `json:"sku"`
}

type ProductSearchResult struct {
	ID           int     `json:"id"`
	Barcode      string  `json:"barcode"`
	Name         string  `json:"name"`
	SellingPrice float64 `json:"selling_price"`
	Stock        float64 `json:"stock"`
	UnitID       int     `json:"unit_id"`
	UnitName     string  `json:"unit_name"`
}

type LowStockProduct struct {
	ID       int     `json:"id"`
	Name     string  `json:"name"`
	Stock    float64 `json:"stock"`
	MinStock float64 `json:"min_stock"`
	UnitName string  `json:"unit_name"`
}

type ImportResult struct {
	Success int                 `json:"success"`
	Failed  int                 `json:"failed"`
	Errors  []ImportErrorDetail `json:"errors"`
}

type ImportErrorDetail struct {
	Row     int    `json:"row"`
	Message string `json:"message"`
}

type BulkImportRequest struct {
	Rows   []BulkImportRow   `json:"rows"`
	Grosir []GrosirImportRow `json:"grosir"`
}

type BulkImportRow struct {
	No          int     `json:"no"`
	Nama        string  `json:"nama"`
	Barcode     string  `json:"barcode"`
	Kategori    string  `json:"kategori"`
	HargaBeli   float64 `json:"harga_beli"`
	HargaJual   float64 `json:"harga_jual"`
	Stok        float64 `json:"stok"`
	StokMinimum float64 `json:"stok_minimum"`
	Satuan      string  `json:"satuan"`
	SatuanID    int     `json:"satuan_id"`
}

type GrosirImportRow struct {
	NoProduk  int     `json:"no_produk"`
	NamaPaket string  `json:"nama_paket"`
	Satuan    string  `json:"satuan"`
	SatuanID  int     `json:"satuan_id"`
	Konversi  float64 `json:"konversi"`
	HargaBeli float64 `json:"harga_beli"`
	HargaJual float64 `json:"harga_jual"`
}

// ImportPreview DTOs

type ImportPreviewRow struct {
	No          int      `json:"no"`
	Nama        string   `json:"nama"`
	Barcode     string   `json:"barcode"`
	Kategori    string   `json:"kategori"`
	HargaBeli   float64  `json:"harga_beli"`
	HargaJual   float64  `json:"harga_jual"`
	Margin      int      `json:"margin"`
	Stok        float64  `json:"stok"`
	StokMinimum float64  `json:"stok_minimum"`
	Satuan      string   `json:"satuan"`
	SatuanID    int      `json:"satuan_id"`
	Valid        bool     `json:"valid"`
	Errors      []string `json:"errors"`
	Warnings    []string `json:"warnings"`
}

type ImportPreviewGrosirRow struct {
	NoProduk  int      `json:"no_produk"`
	NamaPaket string   `json:"nama_paket"`
	Satuan    string   `json:"satuan"`
	SatuanID  int      `json:"satuan_id"`
	Konversi  float64  `json:"konversi"`
	HargaBeli float64  `json:"harga_beli"`
	HargaJual float64  `json:"harga_jual"`
	Valid      bool     `json:"valid"`
	Errors    []string `json:"errors"`
}

type ImportPreviewResponse struct {
	Rows   []ImportPreviewRow      `json:"rows"`
	Grosir []ImportPreviewGrosirRow `json:"grosir"`
}

type BulkImportResult struct {
	Success int                `json:"success"`
	Failed  []BulkImportFailed `json:"failed"`
}

type BulkImportFailed struct {
	Baris  int           `json:"baris"`
	Data   BulkImportRow `json:"data"`
	Alasan string        `json:"alasan"`
}

type UnitInfo struct {
	Name         string
	Abbreviation string
}

type ProductFilter struct {
	Search     string
	CategoryID *int
	IsActive   *bool
	LowStock   bool
	Page       int
	Limit      int
}
