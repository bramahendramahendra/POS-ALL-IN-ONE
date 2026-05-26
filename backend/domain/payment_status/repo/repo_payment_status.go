package repo_payment_status

import (
	dto_payment_status "pos_api/domain/payment_status/dto"

	"gorm.io/gorm"
)

const getAllQuery = `SELECT id, code, label, is_active, sort_order FROM payment_statuses WHERE is_active = 1 ORDER BY sort_order ASC`

type paymentStatusRepo struct {
	db *gorm.DB
}

func NewPaymentStatusRepo(db *gorm.DB) PaymentStatusRepo {
	return &paymentStatusRepo{db: db}
}

func (r *paymentStatusRepo) GetAll() ([]*dto_payment_status.PaymentStatusResponse, error) {
	rows, err := r.db.Raw(getAllQuery).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*dto_payment_status.PaymentStatusResponse
	for rows.Next() {
		var item dto_payment_status.PaymentStatusResponse
		if err := rows.Scan(&item.ID, &item.Code, &item.Label, &item.IsActive, &item.SortOrder); err != nil {
			return nil, err
		}
		items = append(items, &item)
	}
	if items == nil {
		items = []*dto_payment_status.PaymentStatusResponse{}
	}
	return items, nil
}
