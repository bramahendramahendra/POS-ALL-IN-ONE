package dto_transaction

import "time"

type CreateTransactionItemRequest struct {
	ProductID     int     `json:"product_id" validate:"required,min=1"`
	ProductName   string  `json:"product_name" validate:"required"`
	Quantity      float64 `json:"quantity" validate:"required,min=0.001"`
	Unit          string  `json:"unit" validate:"required"`
	Price         float64 `json:"price" validate:"required,min=0"`
	Subtotal      float64 `json:"subtotal" validate:"required,min=0"`
	DiscountItem  float64 `json:"discount_item"`
	ConversionQty float64 `json:"conversion_qty"`
	UnitID        *int    `json:"unit_id"`
}

type CreateTransactionRequest struct {
	ShiftID       *int                           `json:"shift_id"`
	Subtotal      float64                        `json:"subtotal" validate:"required,min=0"`
	Discount      float64                        `json:"discount"`
	Tax           float64                        `json:"tax"`
	TotalAmount   float64                        `json:"total_amount" validate:"required,min=0"`
	PaymentMethod string                         `json:"payment_method" validate:"required,oneof=cash transfer qris credit"`
	PaymentAmount float64                        `json:"payment_amount" validate:"required,min=0"`
	ChangeAmount  float64                        `json:"change_amount"`
	CustomerID    *int                           `json:"customer_id"`
	IsCredit      bool                           `json:"is_credit"`
	DeviceSource  string                         `json:"device_source" validate:"required,oneof=desktop web android"`
	Items         []CreateTransactionItemRequest `json:"items" validate:"required,min=1,dive"`
}

type TransactionItemResponse struct {
	ID            int     `json:"id"`
	ProductID     int     `json:"product_id"`
	ProductName   string  `json:"product_name"`
	Quantity      float64 `json:"quantity"`
	Unit          string  `json:"unit"`
	Price         float64 `json:"price"`
	Subtotal      float64 `json:"subtotal"`
	DiscountItem  float64 `json:"discount_item"`
	ConversionQty float64 `json:"conversion_qty"`
	UnitID        *int    `json:"unit_id"`
}

type TransactionResponse struct {
	ID              int                       `json:"id"`
	TransactionCode string                    `json:"transaction_code"`
	UserID          int                       `json:"user_id"`
	ShiftID         *int                      `json:"shift_id"`
	TransactionDate time.Time                 `json:"transaction_date"`
	Subtotal        float64                   `json:"subtotal"`
	Discount        float64                   `json:"discount"`
	Tax             float64                   `json:"tax"`
	TotalAmount     float64                   `json:"total_amount"`
	PaymentMethod   string                    `json:"payment_method"`
	PaymentAmount   float64                   `json:"payment_amount"`
	ChangeAmount    float64                   `json:"change_amount"`
	CustomerID      *int                      `json:"customer_id"`
	IsCredit        bool                      `json:"is_credit"`
	Status          string                    `json:"status"`
	DeviceSource    string                    `json:"device_source"`
	Items           []TransactionItemResponse `json:"items,omitempty"`
}

type CreateTransactionResponse struct {
	TransactionResponse
}

type TransactionFilter struct {
	Search        string
	Status        string
	PaymentMethod string
	DateFrom      string
	DateTo        string
	UserID        *int
	Page          int
	Limit         int
}
