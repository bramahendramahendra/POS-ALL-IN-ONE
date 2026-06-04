package dto_purchase

type PurchaseItemRequest struct {
	ProductID     int     `json:"product_id" validate:"required,gt=0"`
	Quantity      float64 `json:"quantity" validate:"required,gt=0"`
	Unit          string  `json:"unit" validate:"required"`
	ConversionQty float64 `json:"conversion_qty"`
	PurchasePrice float64 `json:"purchase_price" validate:"required,gt=0"`
}

type PurchaseRequest struct {
	InvoiceNumber  string                `json:"invoice_number" validate:"required"`
	SupplierID     *int                  `json:"supplier_id"`
	PurchaseDate   string                `json:"purchase_date" validate:"required"`
	DiscountAmount float64               `json:"discount_amount"`
	PaymentStatus  string                `json:"payment_status"`
	PaidAmount     float64               `json:"paid_amount"`
	PaymentMethod  string                `json:"payment_method"`
	Notes          string                `json:"notes"`
	Items          []PurchaseItemRequest `json:"items" validate:"required,min=1,dive"`
}

type PayPurchaseRequest struct {
	Amount        float64 `json:"amount" validate:"required,gt=0"`
	PaymentDate   string  `json:"payment_date" validate:"required"`
	PaymentMethod string  `json:"payment_method" validate:"required,oneof=cash transfer card qris kredit"`
	Notes         string  `json:"notes"`
}

type PurchasePaymentResponse struct {
	ID            int     `json:"id"`
	PaymentDate   string  `json:"payment_date"`
	Amount        float64 `json:"amount"`
	PaymentMethod string  `json:"payment_method"`
	Notes         string  `json:"notes"`
	UserName      string  `json:"user_name"`
	CreatedAt     string  `json:"created_at"`
}

type PurchaseItemResponse struct {
	ID            int     `json:"id"`
	ProductID     int     `json:"product_id"`
	ProductName   string  `json:"product_name"`
	Quantity      float64 `json:"quantity"`
	Unit          string  `json:"unit"`
	ConversionQty float64 `json:"conversion_qty"`
	PurchasePrice float64 `json:"purchase_price"`
	Subtotal      float64 `json:"subtotal"`
}

type PurchaseResponse struct {
	ID              int                    `json:"id"`
	PurchaseCode    string                 `json:"purchase_code"`
	InvoiceNumber   string                 `json:"invoice_number"`
	SupplierID      *int                   `json:"supplier_id"`
	SupplierName    string                 `json:"supplier_name"`
	PurchaseDate    string                 `json:"purchase_date"`
	DiscountAmount  float64                `json:"discount_amount"`
	TotalAmount     float64                `json:"total_amount"`
	PaymentStatus   string                 `json:"payment_status"`
	PaidAmount      float64                `json:"paid_amount"`
	RemainingAmount float64                `json:"remaining_amount"`
	UserName        string                 `json:"user_name"`
	Notes           string                 `json:"notes"`
	Items           []PurchaseItemResponse `json:"items,omitempty"`
}

type GeneratePurchaseCodeResponse struct {
	PurchaseCode string `json:"purchase_code"`
}

type PurchaseFilter struct {
	StartDate     string
	EndDate       string
	SupplierID    *int
	PaymentStatus string
	Page          int
	Limit         int
}
