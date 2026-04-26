package repo_supplier

import (
	"fmt"

	dto_supplier "permen_api/domain/supplier/dto"
	model_supplier "permen_api/domain/supplier/model"

	"gorm.io/gorm"
)

const (
	getAllSuppliersQuery      = `SELECT id, supplier_code, name, phone, email, contact_person, is_active FROM suppliers WHERE 1=1`
	countSuppliersBase       = `SELECT COUNT(*) FROM suppliers WHERE 1=1`
	getActiveSupplierList    = `SELECT id, name, supplier_code FROM suppliers WHERE is_active = 1 ORDER BY name`
	getSupplierByID          = `SELECT id, supplier_code, name, address, phone, email, contact_person, notes, is_active FROM suppliers WHERE id = ?`
	getSupplierPurchases     = `SELECT id, purchase_code, purchase_date, total_amount, payment_status FROM purchases WHERE supplier_id = ? ORDER BY purchase_date DESC LIMIT 10`
	checkSupplierHasPO       = `SELECT COUNT(*) FROM purchases WHERE supplier_id = ?`
	generateSupplierCode     = `SELECT COUNT(*) FROM suppliers`
	createSupplier           = `INSERT INTO suppliers (supplier_code, name, address, phone, email, contact_person, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`
	updateSupplier           = `UPDATE suppliers SET name=?, address=?, phone=?, email=?, contact_person=?, notes=?, updated_at=NOW() WHERE id=?`
	deleteSupplier           = `DELETE FROM suppliers WHERE id = ?`
	toggleSupplierStatus     = `UPDATE suppliers SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?`
)

type supplierRepo struct {
	db *gorm.DB
}

func NewSupplierRepo(db *gorm.DB) SupplierRepo {
	return &supplierRepo{db: db}
}

func (r *supplierRepo) GetAll(filter *dto_supplier.SupplierFilter) ([]*dto_supplier.SupplierResponse, int, error) {
	var args, countArgs []interface{}
	conditions := ""

	if filter.Search != "" {
		conditions += " AND (name LIKE ? OR supplier_code LIKE ? OR phone LIKE ?)"
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
	if err := r.db.Raw(countSuppliersBase+conditions, countArgs...).Scan(&total).Error; err != nil {
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

	query := getAllSuppliersQuery + conditions + fmt.Sprintf(" ORDER BY name ASC LIMIT %d OFFSET %d", limit, offset)

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []*dto_supplier.SupplierResponse
	for rows.Next() {
		var item dto_supplier.SupplierResponse
		if err := rows.Scan(&item.ID, &item.SupplierCode, &item.Name, &item.Phone, &item.Email, &item.ContactPerson, &item.IsActive); err != nil {
			return nil, 0, err
		}
		items = append(items, &item)
	}
	return items, total, nil
}

func (r *supplierRepo) GetActiveList() ([]*dto_supplier.SupplierActiveItem, error) {
	rows, err := r.db.Raw(getActiveSupplierList).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*dto_supplier.SupplierActiveItem
	for rows.Next() {
		var item dto_supplier.SupplierActiveItem
		if err := rows.Scan(&item.ID, &item.Name, &item.SupplierCode); err != nil {
			return nil, err
		}
		items = append(items, &item)
	}
	return items, nil
}

func (r *supplierRepo) GetByID(id int) (*model_supplier.Supplier, error) {
	var s model_supplier.Supplier
	if err := r.db.Raw(getSupplierByID, id).Scan(&s).Error; err != nil {
		return nil, err
	}
	if s.ID == 0 {
		return nil, nil
	}
	return &s, nil
}

func (r *supplierRepo) GetPurchaseHistory(supplierID int) ([]dto_supplier.SupplierPurchaseItem, error) {
	rows, err := r.db.Raw(getSupplierPurchases, supplierID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []dto_supplier.SupplierPurchaseItem
	for rows.Next() {
		var item dto_supplier.SupplierPurchaseItem
		if err := rows.Scan(&item.ID, &item.PurchaseCode, &item.PurchaseDate, &item.TotalAmount, &item.PaymentStatus); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func (r *supplierRepo) GetCount() (int, error) {
	var count int
	if err := r.db.Raw(generateSupplierCode).Scan(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *supplierRepo) CountPurchasesBySupplier(supplierID int) (int, error) {
	var count int
	if err := r.db.Raw(checkSupplierHasPO, supplierID).Scan(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *supplierRepo) Create(code string, req *dto_supplier.SupplierRequest) (*dto_supplier.SupplierResponse, error) {
	result := r.db.Exec(createSupplier, code, req.Name, req.Address, req.Phone, req.Email, req.ContactPerson, req.Notes)
	if result.Error != nil {
		return nil, result.Error
	}

	var id int64
	r.db.Raw("SELECT LAST_INSERT_ID()").Scan(&id)

	return &dto_supplier.SupplierResponse{
		ID:            int(id),
		SupplierCode:  code,
		Name:          req.Name,
		Phone:         req.Phone,
		Email:         req.Email,
		ContactPerson: req.ContactPerson,
		IsActive:      true,
	}, nil
}

func (r *supplierRepo) Update(id int, req *dto_supplier.SupplierRequest) (*dto_supplier.SupplierResponse, error) {
	if err := r.db.Exec(updateSupplier, req.Name, req.Address, req.Phone, req.Email, req.ContactPerson, req.Notes, id).Error; err != nil {
		return nil, err
	}

	s, err := r.GetByID(id)
	if err != nil {
		return nil, err
	}

	return &dto_supplier.SupplierResponse{
		ID:            s.ID,
		SupplierCode:  s.SupplierCode,
		Name:          s.Name,
		Phone:         s.Phone,
		Email:         s.Email,
		ContactPerson: s.ContactPerson,
		IsActive:      s.IsActive,
	}, nil
}

func (r *supplierRepo) Delete(id int) error {
	return r.db.Exec(deleteSupplier, id).Error
}

func (r *supplierRepo) ToggleStatus(id int) error {
	return r.db.Exec(toggleSupplierStatus, id).Error
}
