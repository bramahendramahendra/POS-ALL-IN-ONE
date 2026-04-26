package repo_customer

import (
	"fmt"

	dto_customer "permen_api/domain/customer/dto"
	model_customer "permen_api/domain/customer/model"

	"gorm.io/gorm"
)

const (
	getAllCustomersQuery          = `SELECT id, customer_code, name, phone, address, credit_limit, is_active FROM customers WHERE 1=1`
	countCustomersBase           = `SELECT COUNT(*) FROM customers WHERE 1=1`
	getActiveCustomerListQuery   = `SELECT id, name, customer_code, credit_limit FROM customers WHERE is_active = 1 ORDER BY name`
	getCustomerByIDQuery         = `SELECT id, customer_code, name, phone, address, credit_limit, notes, is_active FROM customers WHERE id = ?`
	checkCustomerHasReceivable   = `SELECT COUNT(*) FROM receivables WHERE customer_id = ? AND status != 'paid'`
	generateCustomerCodeQuery    = `SELECT COUNT(*) FROM customers`
	createCustomerQuery          = `INSERT INTO customers (customer_code, name, phone, address, credit_limit, notes) VALUES (?, ?, ?, ?, ?, ?)`
	updateCustomerQuery          = `UPDATE customers SET name=?, phone=?, address=?, credit_limit=?, notes=?, updated_at=NOW() WHERE id=?`
	deleteCustomerQuery          = `DELETE FROM customers WHERE id = ?`
	toggleCustomerStatusQuery    = `UPDATE customers SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?`
)

type customerRepo struct {
	db *gorm.DB
}

func NewCustomerRepo(db *gorm.DB) CustomerRepo {
	return &customerRepo{db: db}
}

func (r *customerRepo) GetAll(filter *dto_customer.CustomerFilter) ([]*dto_customer.CustomerResponse, int, error) {
	var args, countArgs []interface{}
	conditions := ""

	if filter.Search != "" {
		conditions += " AND (name LIKE ? OR customer_code LIKE ? OR phone LIKE ?)"
		like := "%" + filter.Search + "%"
		args = append(args, like, like, like)
		countArgs = append(countArgs, like, like, like)
	}
	if filter.IsActive != nil {
		conditions += " AND is_active = ?"
		args = append(args, *filter.IsActive)
		countArgs = append(countArgs, *filter.IsActive)
	}

	var total int
	if err := r.db.Raw(countCustomersBase+conditions, countArgs...).Scan(&total).Error; err != nil {
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

	query := getAllCustomersQuery + conditions + fmt.Sprintf(" ORDER BY name ASC LIMIT %d OFFSET %d", limit, offset)

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []*dto_customer.CustomerResponse
	for rows.Next() {
		var item dto_customer.CustomerResponse
		if err := rows.Scan(&item.ID, &item.CustomerCode, &item.Name, &item.Phone, &item.Address, &item.CreditLimit, &item.IsActive); err != nil {
			return nil, 0, err
		}
		items = append(items, &item)
	}
	return items, total, nil
}

func (r *customerRepo) GetActiveList() ([]*dto_customer.CustomerActiveItem, error) {
	rows, err := r.db.Raw(getActiveCustomerListQuery).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*dto_customer.CustomerActiveItem
	for rows.Next() {
		var item dto_customer.CustomerActiveItem
		if err := rows.Scan(&item.ID, &item.Name, &item.CustomerCode, &item.CreditLimit); err != nil {
			return nil, err
		}
		items = append(items, &item)
	}
	return items, nil
}

func (r *customerRepo) GetByID(id int) (*model_customer.Customer, error) {
	var c model_customer.Customer
	if err := r.db.Raw(getCustomerByIDQuery, id).Scan(&c).Error; err != nil {
		return nil, err
	}
	if c.ID == 0 {
		return nil, nil
	}
	return &c, nil
}

func (r *customerRepo) GetCount() (int, error) {
	var count int
	if err := r.db.Raw(generateCustomerCodeQuery).Scan(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *customerRepo) CountActiveReceivables(customerID int) (int, error) {
	var count int
	if err := r.db.Raw(checkCustomerHasReceivable, customerID).Scan(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *customerRepo) Create(code string, req *dto_customer.CustomerRequest) (*dto_customer.CustomerResponse, error) {
	result := r.db.Exec(createCustomerQuery, code, req.Name, req.Phone, req.Address, req.CreditLimit, req.Notes)
	if result.Error != nil {
		return nil, result.Error
	}

	var id int64
	r.db.Raw("SELECT LAST_INSERT_ID()").Scan(&id)

	return &dto_customer.CustomerResponse{
		ID:           int(id),
		CustomerCode: code,
		Name:         req.Name,
		Phone:        req.Phone,
		Address:      req.Address,
		CreditLimit:  req.CreditLimit,
		IsActive:     true,
	}, nil
}

func (r *customerRepo) Update(id int, req *dto_customer.CustomerRequest) (*dto_customer.CustomerResponse, error) {
	if err := r.db.Exec(updateCustomerQuery, req.Name, req.Phone, req.Address, req.CreditLimit, req.Notes, id).Error; err != nil {
		return nil, err
	}

	c, err := r.GetByID(id)
	if err != nil {
		return nil, err
	}

	return &dto_customer.CustomerResponse{
		ID:           c.ID,
		CustomerCode: c.CustomerCode,
		Name:         c.Name,
		Phone:        c.Phone,
		Address:      c.Address,
		CreditLimit:  c.CreditLimit,
		IsActive:     c.IsActive,
	}, nil
}

func (r *customerRepo) Delete(id int) error {
	return r.db.Exec(deleteCustomerQuery, id).Error
}

func (r *customerRepo) ToggleStatus(id int) error {
	return r.db.Exec(toggleCustomerStatusQuery, id).Error
}
