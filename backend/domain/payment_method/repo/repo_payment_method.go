package repo_payment_method

import (
	dto_payment_method "pos_api/domain/payment_method/dto"

	"gorm.io/gorm"
)

const getAllQuery = `SELECT id, code, label, is_active, sort_order FROM payment_methods WHERE is_active = 1 ORDER BY sort_order ASC`

type paymentMethodRepo struct {
	db *gorm.DB
}

func NewPaymentMethodRepo(db *gorm.DB) PaymentMethodRepo {
	return &paymentMethodRepo{db: db}
}

func (r *paymentMethodRepo) GetAll() ([]*dto_payment_method.PaymentMethodResponse, error) {
	rows, err := r.db.Raw(getAllQuery).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*dto_payment_method.PaymentMethodResponse
	for rows.Next() {
		var item dto_payment_method.PaymentMethodResponse
		if err := rows.Scan(&item.ID, &item.Code, &item.Label, &item.IsActive, &item.SortOrder); err != nil {
			return nil, err
		}
		items = append(items, &item)
	}
	if items == nil {
		items = []*dto_payment_method.PaymentMethodResponse{}
	}
	return items, nil
}
