package dto_supplier

type SupplierRequest struct {
	Name          string `json:"name" validate:"required"`
	Address       string `json:"address"`
	Phone         string `json:"phone"`
	Email         string `json:"email"`
	ContactPerson string `json:"contact_person"`
	Notes         string `json:"notes"`
}

type SupplierResponse struct {
	ID            int    `json:"id"`
	SupplierCode  string `json:"supplier_code"`
	Name          string `json:"name"`
	Phone         string `json:"phone"`
	Email         string `json:"email"`
	ContactPerson string `json:"contact_person"`
	IsActive      bool   `json:"is_active"`
}

type SupplierActiveItem struct {
	ID           int    `json:"id"`
	SupplierCode string `json:"supplier_code"`
	Name         string `json:"name"`
}

type SupplierPurchaseItem struct {
	ID            int     `json:"id"`
	PurchaseCode  string  `json:"purchase_code"`
	PurchaseDate  string  `json:"purchase_date"`
	TotalAmount   float64 `json:"total_amount"`
	PaymentStatus string  `json:"payment_status"`
}

type SupplierDetailResponse struct {
	ID              int                    `json:"id"`
	SupplierCode    string                 `json:"supplier_code"`
	Name            string                 `json:"name"`
	Address         string                 `json:"address"`
	Phone           string                 `json:"phone"`
	Email           string                 `json:"email"`
	ContactPerson   string                 `json:"contact_person"`
	Notes           string                 `json:"notes"`
	IsActive        bool                   `json:"is_active"`
	PurchaseHistory []SupplierPurchaseItem `json:"purchase_history"`
}

type SupplierFilter struct {
	Search   string
	IsActive *bool
	Page     int
	Limit    int
}
