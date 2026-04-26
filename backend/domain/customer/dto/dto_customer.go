package dto_customer

type CustomerRequest struct {
	Name        string  `json:"name" validate:"required"`
	Phone       string  `json:"phone"`
	Address     string  `json:"address"`
	CreditLimit float64 `json:"credit_limit"`
	Notes       string  `json:"notes"`
}

type CustomerResponse struct {
	ID           int     `json:"id"`
	CustomerCode string  `json:"customer_code"`
	Name         string  `json:"name"`
	Phone        string  `json:"phone"`
	Address      string  `json:"address"`
	CreditLimit  float64 `json:"credit_limit"`
	IsActive     bool    `json:"is_active"`
}

type CustomerActiveItem struct {
	ID           int     `json:"id"`
	Name         string  `json:"name"`
	CustomerCode string  `json:"customer_code"`
	CreditLimit  float64 `json:"credit_limit"`
}

type CustomerDetailResponse struct {
	ID           int     `json:"id"`
	CustomerCode string  `json:"customer_code"`
	Name         string  `json:"name"`
	Phone        string  `json:"phone"`
	Address      string  `json:"address"`
	CreditLimit  float64 `json:"credit_limit"`
	Notes        string  `json:"notes"`
	IsActive     bool    `json:"is_active"`
}

type CustomerFilter struct {
	Search   string
	IsActive *bool
	Page     int
	Limit    int
}
