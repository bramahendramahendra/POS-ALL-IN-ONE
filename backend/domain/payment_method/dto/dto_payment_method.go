package dto_payment_method

type PaymentMethodResponse struct {
	ID        int    `json:"id"`
	Code      string `json:"code"`
	Label     string `json:"label"`
	IsActive  int    `json:"is_active"`
	SortOrder int    `json:"sort_order"`
}
