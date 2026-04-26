package repo_receivable

import (
	"fmt"
	"time"

	dto_receivable "permen_api/domain/receivable/dto"
	model_receivable "permen_api/domain/receivable/model"

	"gorm.io/gorm"
)

const (
	getAllReceivablesQuery = `SELECT r.id, t.transaction_code, c.name as customer_name, r.total_amount, r.paid_amount, r.remaining_amount, r.status, r.due_date FROM receivables r LEFT JOIN transactions t ON r.transaction_id = t.id LEFT JOIN customers c ON r.customer_id = c.id WHERE 1=1`
	countReceivablesBase  = `SELECT COUNT(*) FROM receivables r LEFT JOIN transactions t ON r.transaction_id = t.id LEFT JOIN customers c ON r.customer_id = c.id WHERE 1=1`
	getReceivableByIDQuery    = `SELECT r.id, r.transaction_id, r.customer_id, r.total_amount, r.paid_amount, r.remaining_amount, r.status, r.due_date, r.created_at, r.updated_at FROM receivables r WHERE r.id = ?`
	getReceivableDetailQuery  = `SELECT r.id, t.transaction_code, c.name as customer_name, r.total_amount, r.paid_amount, r.remaining_amount, r.status, r.due_date FROM receivables r LEFT JOIN transactions t ON r.transaction_id = t.id LEFT JOIN customers c ON r.customer_id = c.id WHERE r.id = ?`
	getReceivableSummaryQuery = `SELECT r.customer_id, c.name as customer_name, SUM(r.total_amount) as total_receivable, SUM(r.paid_amount) as total_paid, SUM(r.remaining_amount) as total_remaining, COUNT(r.id) as count FROM receivables r LEFT JOIN customers c ON r.customer_id = c.id WHERE r.status != 'paid' GROUP BY r.customer_id, c.name ORDER BY total_remaining DESC`
	createPaymentQuery    = `INSERT INTO receivable_payments (receivable_id, payment_date, amount, payment_method, notes, user_id) VALUES (?, ?, ?, ?, ?, ?)`
	updateReceivableQuery = `UPDATE receivables SET paid_amount = paid_amount + ?, remaining_amount = remaining_amount - ?, status = CASE WHEN remaining_amount - ? <= 0 THEN 'paid' WHEN paid_amount + ? > 0 THEN 'partial' ELSE 'unpaid' END, updated_at = NOW() WHERE id = ?`
	getPaymentsQuery      = `SELECT rp.id, rp.payment_date, rp.amount, rp.payment_method, u.full_name as user_name, rp.notes FROM receivable_payments rp LEFT JOIN users u ON rp.user_id = u.id WHERE rp.receivable_id = ? ORDER BY rp.payment_date DESC`
)

type receivableRepo struct {
	db *gorm.DB
}

func NewReceivableRepo(db *gorm.DB) ReceivableRepo {
	return &receivableRepo{db: db}
}

func (r *receivableRepo) GetAll(filter *dto_receivable.ReceivableFilter) ([]*dto_receivable.ReceivableResponse, int, error) {
	var args, countArgs []interface{}
	conditions := ""

	if filter.Search != "" {
		conditions += " AND (c.name LIKE ? OR t.transaction_code LIKE ?)"
		like := "%" + filter.Search + "%"
		args = append(args, like, like)
		countArgs = append(countArgs, like, like)
	}
	if filter.Status != "" {
		conditions += " AND r.status = ?"
		args = append(args, filter.Status)
		countArgs = append(countArgs, filter.Status)
	}

	var total int
	if err := r.db.Raw(countReceivablesBase+conditions, countArgs...).Scan(&total).Error; err != nil {
		return nil, 0, err
	}

	page := filter.Page
	limit := filter.Limit
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := getAllReceivablesQuery + conditions + fmt.Sprintf(" ORDER BY r.created_at DESC LIMIT %d OFFSET %d", limit, offset)

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []*dto_receivable.ReceivableResponse
	for rows.Next() {
		var item dto_receivable.ReceivableResponse
		if err := rows.Scan(&item.ID, &item.TransactionCode, &item.CustomerName, &item.TotalAmount, &item.PaidAmount, &item.RemainingAmount, &item.Status, &item.DueDate); err != nil {
			return nil, 0, err
		}
		items = append(items, &item)
	}
	return items, total, nil
}

func (r *receivableRepo) GetByID(id int) (*model_receivable.Receivable, error) {
	var rec model_receivable.Receivable
	if err := r.db.Raw(getReceivableByIDQuery, id).Scan(&rec).Error; err != nil {
		return nil, err
	}
	if rec.ID == 0 {
		return nil, nil
	}
	return &rec, nil
}

func (r *receivableRepo) GetSummary() ([]*dto_receivable.ReceivableSummaryItem, error) {
	rows, err := r.db.Raw(getReceivableSummaryQuery).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*dto_receivable.ReceivableSummaryItem
	for rows.Next() {
		var item dto_receivable.ReceivableSummaryItem
		if err := rows.Scan(&item.CustomerID, &item.CustomerName, &item.TotalReceivable, &item.TotalPaid, &item.TotalRemaining, &item.Count); err != nil {
			return nil, err
		}
		items = append(items, &item)
	}
	return items, nil
}

func (r *receivableRepo) GetPayments(receivableID int) ([]*dto_receivable.PaymentResponse, error) {
	rows, err := r.db.Raw(getPaymentsQuery, receivableID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*dto_receivable.PaymentResponse
	for rows.Next() {
		var item dto_receivable.PaymentResponse
		if err := rows.Scan(&item.ID, &item.PaymentDate, &item.Amount, &item.PaymentMethod, &item.UserName, &item.Notes); err != nil {
			return nil, err
		}
		items = append(items, &item)
	}
	return items, nil
}

func (r *receivableRepo) CreatePayment(receivableID int, req *dto_receivable.PayRequest, userID int) error {
	return r.db.Exec(createPaymentQuery, receivableID, time.Now(), req.Amount, req.PaymentMethod, req.Notes, userID).Error
}

func (r *receivableRepo) UpdateAfterPayment(receivableID int, amount float64) error {
	return r.db.Exec(updateReceivableQuery, amount, amount, amount, amount, receivableID).Error
}

func (r *receivableRepo) GetDetailByID(id int) (*dto_receivable.ReceivableDetailResponse, error) {
	var item dto_receivable.ReceivableDetailResponse
	if err := r.db.Raw(getReceivableDetailQuery, id).Scan(&item).Error; err != nil {
		return nil, err
	}
	if item.ID == 0 {
		return nil, nil
	}
	return &item, nil
}
