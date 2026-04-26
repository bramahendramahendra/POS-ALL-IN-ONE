package dto_expense

type ExpenseRequest struct {
	ExpenseDate   string  `json:"expense_date" validate:"required"`
	Category      string  `json:"category" validate:"required"`
	Description   string  `json:"description"`
	Amount        float64 `json:"amount" validate:"required,gt=0"`
	PaymentMethod string  `json:"payment_method" validate:"required,oneof=cash debit credit qris"`
	Notes         string  `json:"notes"`
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
}

type ExpenseFilter struct {
	StartDate string
	EndDate   string
	Category  string
	UserID    *int
	Page      int
	Limit     int
}
