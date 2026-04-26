package dto_purchase

type PurchaseItemRequest struct {
	ProductID     int     `json:"product_id" validate:"required,gt=0"`
	ProductName   string  `json:"product_name" validate:"required"`
	Quantity      float64 `json:"quantity" validate:"required,gt=0"`
	Unit          string  `json:"unit" validate:"required"`
	PurchasePrice float64 `json:"purchase_price" validate:"required,gt=0"`
}

type PurchaseRequest struct {
	SupplierID   *int                  `json:"supplier_id"`
	SupplierName string                `json:"supplier_name" validate:"required"`
	PurchaseDate string                `json:"purchase_date" validate:"required"`
	Notes        string                `json:"notes"`
	Items        []PurchaseItemRequest `json:"items" validate:"required,min=1,dive"`
}

type PayPurchaseRequest struct {
	Amount float64 `json:"amount" validate:"required,gt=0"`
}

type PurchaseItemResponse struct {
	ID            int     `json:"id"`
	ProductID     int     `json:"product_id"`
	ProductName   string  `json:"product_name"`
	Quantity      float64 `json:"quantity"`
	Unit          string  `json:"unit"`
	PurchasePrice float64 `json:"purchase_price"`
	Subtotal      float64 `json:"subtotal"`
}

type PurchaseResponse struct {
	ID              int                    `json:"id"`
	PurchaseCode    string                 `json:"purchase_code"`
	SupplierID      *int                   `json:"supplier_id"`
	SupplierName    string                 `json:"supplier_name"`
	PurchaseDate    string                 `json:"purchase_date"`
	TotalAmount     float64                `json:"total_amount"`
	PaymentStatus   string                 `json:"payment_status"`
	PaidAmount      float64                `json:"paid_amount"`
	RemainingAmount float64                `json:"remaining_amount"`
	UserName        string                 `json:"user_name"`
	Notes           string                 `json:"notes"`
	Items           []PurchaseItemResponse `json:"items,omitempty"`
}

type PurchaseFilter struct {
	StartDate     string
	EndDate       string
	SupplierID    *int
	PaymentStatus string
	Page          int
	Limit         int
}
