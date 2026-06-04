package dto_expense

type ExpenseRequest struct {
	ExpenseDate   string  `json:"expense_date" validate:"required"`
	Category      string  `json:"category" validate:"required"`
	Description   string  `json:"description"`
	Amount        float64 `json:"amount" validate:"required,gt=0"`
	PaymentMethod string  `json:"payment_method" validate:"required,oneof=cash transfer card qris kredit"`
	Notes         string  `json:"notes"`
	// CashDrawerID opsional: dikirim oleh desktop saat offline agar expense dikaitkan ke sesi kas yang tepat.
	// Jika nil, backend fallback ke GetOpenCashDrawer (kas yang sedang terbuka milik user).
	CashDrawerID *int `json:"cash_drawer_id"`
}

type ExpenseResponse struct {
	ID            int     `json:"id"`
	ExpenseDate   string  `json:"expense_date"`
	Category      string  `json:"category"`
	Description   string  `json:"description"`
	Amount        float64 `json:"amount"`
	PaymentMethod string  `json:"payment_method"`
	UserName      string  `json:"user_name"`
	Notes         string  `json:"notes"`
	UserID        int     `json:"-"` // internal: digunakan service untuk mencari kas yang terbuka
}

type ExpenseFilter struct {
	StartDate string
	EndDate   string
	Category  string
	UserID    *int
	Page      int
	Limit     int
}
