package dto_product

type ProductUnitRequest struct {
	UnitID        int     `json:"unit_id" validate:"required"`
	UnitName      string  `json:"unit_name" validate:"required"`
	ConversionQty float64 `json:"conversion_qty" validate:"required,min=0"`
	SellingPrice  float64 `json:"selling_price" validate:"min=0"`
	IsDefault     bool    `json:"is_default"`
}

type ProductUnitResponse struct {
	ID            int     `json:"id"`
	ProductID     int     `json:"product_id"`
	UnitID        int     `json:"unit_id"`
	UnitName      string  `json:"unit_name"`
	ConversionQty float64 `json:"conversion_qty"`
	SellingPrice  float64 `json:"selling_price"`
	IsDefault     bool    `json:"is_default"`
}

type SaveProductUnitsRequest struct {
	Units []ProductUnitRequest `json:"units" validate:"required,min=1,dive"`
}
