package dto_product

type ProductUnitRequest struct {
	UnitID        int     `json:"unit_id"`
	UnitName      string  `json:"unit_name" validate:"required"`
	ConversionQty float64 `json:"conversion_qty" validate:"required,min=0"`
	PurchasePrice float64 `json:"purchase_price" validate:"min=0"`
	SellingPrice  float64 `json:"selling_price" validate:"min=0"`
	IsDefault     bool    `json:"is_default"`
}

type ProductUnitResponse struct {
	ID            int     `json:"id"`
	ProductID     int     `json:"product_id"`
	UnitID        int     `json:"unit_id"`
	UnitName      string  `json:"unit_name"`
	Abbreviation  string  `json:"abbreviation"`
	ConversionQty float64 `json:"conversion_qty"`
	PurchasePrice float64 `json:"purchase_price"`
	SellingPrice  float64 `json:"selling_price"`
	IsDefault     bool    `json:"is_default"`
}

type SaveProductUnitsRequest struct {
	Units []ProductUnitRequest `json:"units" validate:"required,min=1,dive"`
}
