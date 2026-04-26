package dto_product

type ProductRequest struct {
	Barcode       string  `json:"barcode"`
	Name          string  `json:"name" validate:"required"`
	CategoryID    *int    `json:"category_id"`
	PurchasePrice float64 `json:"purchase_price" validate:"min=0"`
	SellingPrice  float64 `json:"selling_price" validate:"required,min=0"`
	Stock         float64 `json:"stock" validate:"min=0"`
	MinStock      float64 `json:"min_stock" validate:"min=0"`
	Unit          string  `json:"unit" validate:"required"`
}

type ProductResponse struct {
	ID            int     `json:"id"`
	Barcode       string  `json:"barcode"`
	Name          string  `json:"name"`
	CategoryID    *int    `json:"category_id"`
	CategoryName  string  `json:"category_name"`
	PurchasePrice float64 `json:"purchase_price"`
	SellingPrice  float64 `json:"selling_price"`
	Stock         float64 `json:"stock"`
	MinStock      float64 `json:"min_stock"`
	Unit          string  `json:"unit"`
	IsActive      bool    `json:"is_active"`
}

type ProductSearchResult struct {
	ID           int     `json:"id"`
	Barcode      string  `json:"barcode"`
	Name         string  `json:"name"`
	SellingPrice float64 `json:"selling_price"`
	Stock        float64 `json:"stock"`
	Unit         string  `json:"unit"`
}

type LowStockProduct struct {
	ID       int     `json:"id"`
	Name     string  `json:"name"`
	Stock    float64 `json:"stock"`
	MinStock float64 `json:"min_stock"`
	Unit     string  `json:"unit"`
}

type ProductFilter struct {
	Search     string
	CategoryID *int
	IsActive   *bool
	LowStock   bool
	Page       int
	Limit      int
}
