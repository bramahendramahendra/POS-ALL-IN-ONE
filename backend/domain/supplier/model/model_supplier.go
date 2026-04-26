package model_supplier

import "time"

type Supplier struct {
	ID            int        `db:"id"`
	SupplierCode  string     `db:"supplier_code"`
	Name          string     `db:"name"`
	Address       string     `db:"address"`
	Phone         string     `db:"phone"`
	Email         string     `db:"email"`
	ContactPerson string     `db:"contact_person"`
	Notes         string     `db:"notes"`
	IsActive      bool       `db:"is_active"`
	CreatedAt     time.Time  `db:"created_at"`
	UpdatedAt     *time.Time `db:"updated_at"`
}

type SupplierPurchase struct {
	ID            int     `db:"id"`
	PurchaseCode  string  `db:"purchase_code"`
	PurchaseDate  string  `db:"purchase_date"`
	TotalAmount   float64 `db:"total_amount"`
	PaymentStatus string  `db:"payment_status"`
}
