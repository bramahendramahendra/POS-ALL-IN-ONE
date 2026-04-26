package dto_product

type ProductPriceRequest struct {
	TierName string  `json:"tier_name" validate:"required"`
	MinQty   float64 `json:"min_qty" validate:"min=0"`
	Price    float64 `json:"price" validate:"required,min=0"`
}

type ProductPriceResponse struct {
	ID        int     `json:"id"`
	ProductID int     `json:"product_id"`
	TierName  string  `json:"tier_name"`
	MinQty    float64 `json:"min_qty"`
	Price     float64 `json:"price"`
}

type SaveProductPricesRequest struct {
	Prices []ProductPriceRequest `json:"prices" validate:"required,min=1,dive"`
}
