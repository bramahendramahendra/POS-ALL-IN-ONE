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
	ID              int     `json:"id"`
	PurchaseCode    string  `json:"purchase_code"`
	PurchaseDate    string  `json:"purchase_date"`
	TotalAmount     float64 `json:"total_amount"`
	PaymentStatus   string  `json:"payment_status"`
	RemainingAmount float64 `json:"remaining_amount"`
}

type SupplierReturnHistoryItem struct {
	ID          int     `json:"id"`
	ReturnCode  string  `json:"return_code"`
	ReturnDate  string  `json:"return_date"`
	TotalReturn float64 `json:"total_return"`
	Reason      string  `json:"reason"`
	Status      string  `json:"status"`
}

type SupplierDetailResponse struct {
	ID              int                          `json:"id"`
	SupplierCode    string                       `json:"supplier_code"`
	Name            string                       `json:"name"`
	Address         string                       `json:"address"`
	Phone           string                       `json:"phone"`
	Email           string                       `json:"email"`
	ContactPerson   string                       `json:"contact_person"`
	Notes           string                       `json:"notes"`
	IsActive        bool                         `json:"is_active"`
	TotalPurchases  int                          `json:"total_purchases"`
	TotalAmount     float64                      `json:"total_amount"`
	TotalDebt       float64                      `json:"total_debt"`
	TotalReturn     float64                      `json:"total_return"`
	PurchaseHistory []SupplierPurchaseItem        `json:"purchase_history"`
	ReturnHistory   []SupplierReturnHistoryItem   `json:"return_history"`
}

type SupplierFilter struct {
	Search   string
	IsActive *bool
	Page     int
	Limit    int
}
