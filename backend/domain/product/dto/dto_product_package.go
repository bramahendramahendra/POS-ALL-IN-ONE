package dto_product

type ProductPackageRequest struct {
	UnitID        int     `json:"unit_id" validate:"required,min=1"`
	PackageName   string  `json:"package_name"`
	ConversionQty float64 `json:"conversion_qty" validate:"required,min=0.001"`
	PurchasePrice float64 `json:"purchase_price" validate:"min=0"`
	SellingPrice  float64 `json:"selling_price" validate:"min=0"`
	IsDefault     bool    `json:"is_default"`
}

type ProductPackageResponse struct {
	ID            int     `json:"id"`
	ProductID     int     `json:"product_id"`
	UnitID        int     `json:"unit_id"`
	UnitName      string  `json:"unit_name"`
	Abbreviation  string  `json:"abbreviation"`
	PackageName   string  `json:"package_name"`
	ConversionQty float64 `json:"conversion_qty"`
	PurchasePrice float64 `json:"purchase_price"`
	SellingPrice  float64 `json:"selling_price"`
	IsDefault     bool    `json:"is_default"`
}

type SaveProductPackagesRequest struct {
	Packages []ProductPackageRequest `json:"packages" validate:"required,min=1,dive"`
}
