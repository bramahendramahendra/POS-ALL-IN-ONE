package repo_supplier_return

import (
	"fmt"
	"time"

	dto_supplier_return "permen_api/domain/supplier_return/dto"
	model_supplier_return "permen_api/domain/supplier_return/model"

	"gorm.io/gorm"
)

const (
	generateReturnCodeQuery  = `SELECT COUNT(*) FROM supplier_returns WHERE DATE(return_date) = ?`
	createReturnQuery        = `INSERT INTO supplier_returns (return_code, purchase_id, supplier_id, supplier_name, return_date, total_return_amount, reason, status, user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
	createReturnItemQuery    = `INSERT INTO supplier_return_items (return_id, purchase_item_id, product_id, product_name, quantity, unit, purchase_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	updateReturnStatusQuery  = `UPDATE supplier_returns SET status = ?, notes = ?, updated_at = NOW() WHERE id = ?`
	reduceStockQuery         = `UPDATE products SET stock = stock - ?, updated_at = NOW() WHERE id = ?`
	getReturnItemsQuery      = `SELECT sri.id, sri.product_id, sri.product_name, sri.quantity, sri.unit, sri.purchase_price, sri.subtotal FROM supplier_return_items sri WHERE sri.return_id = ?`
	checkReturnApprovedQuery = `SELECT status FROM supplier_returns WHERE id = ?`
	getReturnByIDQuery       = `SELECT sr.id, sr.return_code, sr.purchase_id, sr.supplier_id, sr.supplier_name, sr.return_date, sr.total_return_amount, sr.reason, sr.status, u.full_name as user_name, sr.notes FROM supplier_returns sr LEFT JOIN users u ON sr.user_id = u.id WHERE sr.id = ?`
	getAllReturnsBase         = `SELECT sr.id, sr.return_code, sr.purchase_id, sr.supplier_id, sr.supplier_name, sr.return_date, sr.total_return_amount, sr.reason, sr.status, u.full_name as user_name, sr.notes FROM supplier_returns sr LEFT JOIN users u ON sr.user_id = u.id WHERE 1=1`
	countReturnsBase         = `SELECT COUNT(*) FROM supplier_returns sr WHERE 1=1`
	deleteReturnItemsQuery   = `DELETE FROM supplier_return_items WHERE return_id = ?`
	deleteReturnQuery        = `DELETE FROM supplier_returns WHERE id = ?`
	getProductStockQuery     = `SELECT stock FROM products WHERE id = ? LIMIT 1`
	createStockMutationQuery = `INSERT INTO stock_mutations (product_id, mutation_type, quantity, stock_before, stock_after, reference_type, reference_id, notes, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
)

type supplierReturnRepo struct {
	db *gorm.DB
}

func NewSupplierReturnRepo(db *gorm.DB) SupplierReturnRepo {
	return &supplierReturnRepo{db: db}
}

func (r *supplierReturnRepo) GetAll(filter *dto_supplier_return.SupplierReturnFilter) ([]*dto_supplier_return.SupplierReturnResponse, int, error) {
	var args, countArgs []interface{}
	conditions := ""

	if filter.StartDate != "" {
		conditions += " AND DATE(sr.return_date) >= ?"
		args = append(args, filter.StartDate)
		countArgs = append(countArgs, filter.StartDate)
	}
	if filter.EndDate != "" {
		conditions += " AND DATE(sr.return_date) <= ?"
		args = append(args, filter.EndDate)
		countArgs = append(countArgs, filter.EndDate)
	}
	if filter.SupplierID != nil {
		conditions += " AND sr.supplier_id = ?"
		args = append(args, *filter.SupplierID)
		countArgs = append(countArgs, *filter.SupplierID)
	}
	if filter.Status != "" {
		conditions += " AND sr.status = ?"
		args = append(args, filter.Status)
		countArgs = append(countArgs, filter.Status)
	}

	var total int
	if err := r.db.Raw(countReturnsBase+conditions, countArgs...).Scan(&total).Error; err != nil {
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

	query := getAllReturnsBase + conditions + fmt.Sprintf(" ORDER BY sr.return_date DESC, sr.id DESC LIMIT %d OFFSET %d", limit, offset)

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []*dto_supplier_return.SupplierReturnResponse
	for rows.Next() {
		var item dto_supplier_return.SupplierReturnResponse
		if err := rows.Scan(
			&item.ID, &item.ReturnCode, &item.PurchaseID, &item.SupplierID, &item.SupplierName,
			&item.ReturnDate, &item.TotalReturnAmount, &item.Reason, &item.Status, &item.UserName, &item.Notes,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, &item)
	}
	if items == nil {
		items = []*dto_supplier_return.SupplierReturnResponse{}
	}
	return items, total, nil
}

func (r *supplierReturnRepo) GetByID(id int) (*dto_supplier_return.SupplierReturnResponse, error) {
	var item dto_supplier_return.SupplierReturnResponse
	result := r.db.Raw(getReturnByIDQuery, id).Scan(&item)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}

	modelItems, err := r.GetItems(id)
	if err != nil {
		return nil, err
	}
	for _, mi := range modelItems {
		item.Items = append(item.Items, dto_supplier_return.SupplierReturnItemResponse{
			ID:            mi.ID,
			ProductID:     mi.ProductID,
			ProductName:   mi.ProductName,
			Quantity:      mi.Quantity,
			Unit:          mi.Unit,
			PurchasePrice: mi.PurchasePrice,
			Subtotal:      mi.Subtotal,
		})
	}
	return &item, nil
}

func (r *supplierReturnRepo) GetStatus(id int) (string, error) {
	var status string
	result := r.db.Raw(checkReturnApprovedQuery, id).Scan(&status)
	if result.Error != nil {
		return "", result.Error
	}
	return status, nil
}

func (r *supplierReturnRepo) GetItems(returnID int) ([]model_supplier_return.SupplierReturnItem, error) {
	rows, err := r.db.Raw(getReturnItemsQuery, returnID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model_supplier_return.SupplierReturnItem
	for rows.Next() {
		var item model_supplier_return.SupplierReturnItem
		if err := rows.Scan(
			&item.ID, &item.ProductID, &item.ProductName,
			&item.Quantity, &item.Unit, &item.PurchasePrice, &item.Subtotal,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func (r *supplierReturnRepo) Create(req *dto_supplier_return.CreateSupplierReturnRequest, userID int) (*dto_supplier_return.SupplierReturnResponse, error) {
	var returnID int

	err := r.db.Transaction(func(tx *gorm.DB) error {
		today := time.Now().Format("2006-01-02")
		var count int
		if err := tx.Raw(generateReturnCodeQuery, today).Scan(&count).Error; err != nil {
			return err
		}
		code := fmt.Sprintf("RTR-%s-%03d", time.Now().Format("20060102"), count+1)

		var totalAmount float64
		for _, item := range req.Items {
			totalAmount += item.PurchasePrice * item.Quantity
		}

		if err := tx.Exec(createReturnQuery,
			code, req.PurchaseID, req.SupplierID, req.SupplierName,
			req.ReturnDate, totalAmount, req.Reason, userID, req.Notes,
		).Error; err != nil {
			return err
		}

		if err := tx.Raw(`SELECT LAST_INSERT_ID()`).Scan(&returnID).Error; err != nil {
			return err
		}

		for _, item := range req.Items {
			subtotal := item.PurchasePrice * item.Quantity
			if err := tx.Exec(createReturnItemQuery,
				returnID, item.PurchaseItemID, item.ProductID, item.ProductName,
				item.Quantity, item.Unit, item.PurchasePrice, subtotal,
			).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}
	return r.GetByID(returnID)
}

func (r *supplierReturnRepo) UpdateStatus(id int, status, notes string) error {
	return r.db.Exec(updateReturnStatusQuery, status, notes, id).Error
}

func (r *supplierReturnRepo) ApproveWithStockReduction(id int, userID int) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(updateReturnStatusQuery, "approved", "", id).Error; err != nil {
			return err
		}

		items, err := r.GetItems(id)
		if err != nil {
			return err
		}

		for _, item := range items {
			var stockBefore float64
			if err := tx.Raw(getProductStockQuery, item.ProductID).Scan(&stockBefore).Error; err != nil {
				return err
			}

			if err := tx.Exec(reduceStockQuery, item.Quantity, item.ProductID).Error; err != nil {
				return err
			}

			stockAfter := stockBefore - item.Quantity
			notes := fmt.Sprintf("Supplier Return #%d", id)
			if err := tx.Exec(createStockMutationQuery,
				item.ProductID, "return", item.Quantity, stockBefore, stockAfter,
				"supplier_return", id, notes, userID,
			).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *supplierReturnRepo) Delete(id int) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(deleteReturnItemsQuery, id).Error; err != nil {
			return err
		}
		return tx.Exec(deleteReturnQuery, id).Error
	})
}
