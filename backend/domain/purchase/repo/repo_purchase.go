package repo_purchase

import (
	"fmt"
	"time"

	dto_purchase "pos_api/domain/purchase/dto"
	model_purchase "pos_api/domain/purchase/model"

	"gorm.io/gorm"
)

const (
	generatePurchaseCodeQuery = `SELECT COUNT(*) FROM purchases WHERE DATE(purchase_date) = ?`
	createPurchaseQuery       = `INSERT INTO purchases (purchase_code, invoice_number, supplier_id, purchase_date, discount_amount, total_amount, payment_status, paid_amount, remaining_amount, user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	createPurchaseItemQuery   = `INSERT INTO purchase_items (purchase_id, product_id, quantity, unit, conversion_qty, purchase_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)`
	addStockQuery             = `UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?`
	payPurchaseQuery          = `UPDATE purchases SET paid_amount = paid_amount + ?, remaining_amount = remaining_amount - ?, payment_status = CASE WHEN remaining_amount - ? <= 0 THEN 'paid' WHEN paid_amount + ? > 0 THEN 'partial' ELSE 'unpaid' END, updated_at = NOW() WHERE id = ?`
	getPurchaseItemsQuery     = `SELECT pi.id, pi.product_id, COALESCE(p.name, '') as product_name, pi.quantity, pi.unit, COALESCE(pi.conversion_qty, 1) as conversion_qty, pi.purchase_price, pi.subtotal FROM purchase_items pi LEFT JOIN products p ON pi.product_id = p.id WHERE pi.purchase_id = ?`
	createPaymentQuery        = `INSERT INTO purchase_payments (purchase_id, payment_date, amount, payment_method, notes, user_id) VALUES (?, ?, ?, ?, ?, ?)`
	getPaymentsQuery          = `SELECT pp.id, pp.payment_date, pp.amount, COALESCE(pp.payment_method, '') as payment_method, COALESCE(pp.notes, '') as notes, COALESCE(u.full_name, '') as user_name, pp.created_at FROM purchase_payments pp LEFT JOIN users u ON pp.user_id = u.id WHERE pp.purchase_id = ? ORDER BY pp.created_at ASC`
	rollbackStockQuery           = `UPDATE products SET stock = stock - ?, updated_at = NOW() WHERE id = ?`
	deleteStockMutationsQuery    = `DELETE FROM stock_mutations WHERE reference_type = 'purchase' AND reference_id = ?`
	deletePurchaseItemsQuery     = `DELETE FROM purchase_items WHERE purchase_id = ?`
	deletePurchaseQuery          = `DELETE FROM purchases WHERE id = ?`
	getPurchaseByIDQuery      = `SELECT p.id, p.purchase_code, p.invoice_number, p.supplier_id, COALESCE(s.name, '') as supplier_name, p.purchase_date, p.discount_amount, p.total_amount, p.payment_status, p.paid_amount, p.remaining_amount, COALESCE(u.full_name, '') as user_name, p.notes FROM purchases p LEFT JOIN users u ON p.user_id = u.id LEFT JOIN suppliers s ON p.supplier_id = s.id WHERE p.id = ?`
	getRawPurchaseByIDQuery   = `SELECT id, purchase_code, invoice_number, supplier_id, purchase_date, discount_amount, total_amount, payment_status, paid_amount, remaining_amount, user_id, notes FROM purchases WHERE id = ?`
	getAllPurchasesBase       = `SELECT p.id, p.purchase_code, p.invoice_number, p.supplier_id, COALESCE(s.name, '') as supplier_name, p.purchase_date, p.discount_amount, p.total_amount, p.payment_status, p.paid_amount, p.remaining_amount, COALESCE(u.full_name, '') as user_name, p.notes FROM purchases p LEFT JOIN users u ON p.user_id = u.id LEFT JOIN suppliers s ON p.supplier_id = s.id WHERE 1=1`
	countPurchasesBase        = `SELECT COUNT(*) FROM purchases p WHERE 1=1`
	createStockMutationQuery  = `INSERT INTO stock_mutations (product_id, mutation_type, quantity, stock_before, stock_after, reference_type, reference_id, notes, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	getProductStockQuery      = `SELECT stock FROM products WHERE id = ? LIMIT 1`
	validatePaymentMethodQuery = `SELECT COUNT(*) FROM payment_methods WHERE code = ? AND is_active = 1`
)

type purchaseRepo struct {
	db *gorm.DB
}

func NewPurchaseRepo(db *gorm.DB) PurchaseRepo {
	return &purchaseRepo{db: db}
}

func (r *purchaseRepo) GetAll(filter *dto_purchase.PurchaseFilter) ([]*dto_purchase.PurchaseResponse, int, error) {
	var args, countArgs []interface{}
	conditions := ""

	if filter.StartDate != "" {
		conditions += " AND DATE(p.purchase_date) >= ?"
		args = append(args, filter.StartDate)
		countArgs = append(countArgs, filter.StartDate)
	}
	if filter.EndDate != "" {
		conditions += " AND DATE(p.purchase_date) <= ?"
		args = append(args, filter.EndDate)
		countArgs = append(countArgs, filter.EndDate)
	}
	if filter.SupplierID != nil {
		conditions += " AND p.supplier_id = ?"
		args = append(args, *filter.SupplierID)
		countArgs = append(countArgs, *filter.SupplierID)
	}
	if filter.PaymentStatus != "" {
		conditions += " AND p.payment_status = ?"
		args = append(args, filter.PaymentStatus)
		countArgs = append(countArgs, filter.PaymentStatus)
	}

	var total int
	if err := r.db.Raw(countPurchasesBase+conditions, countArgs...).Scan(&total).Error; err != nil {
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

	query := getAllPurchasesBase + conditions + fmt.Sprintf(" ORDER BY p.purchase_date DESC, p.id DESC LIMIT %d OFFSET %d", limit, offset)

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []*dto_purchase.PurchaseResponse
	for rows.Next() {
		var item dto_purchase.PurchaseResponse
		if err := rows.Scan(
			&item.ID, &item.PurchaseCode, &item.InvoiceNumber, &item.SupplierID, &item.SupplierName,
			&item.PurchaseDate, &item.DiscountAmount, &item.TotalAmount, &item.PaymentStatus,
			&item.PaidAmount, &item.RemainingAmount, &item.UserName, &item.Notes,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, &item)
	}
	if items == nil {
		items = []*dto_purchase.PurchaseResponse{}
	}
	return items, total, nil
}

func (r *purchaseRepo) GetByID(id int) (*dto_purchase.PurchaseResponse, error) {
	rows, err := r.db.Raw(getPurchaseByIDQuery, id).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, nil
	}

	var item dto_purchase.PurchaseResponse
	if err := rows.Scan(
		&item.ID, &item.PurchaseCode, &item.InvoiceNumber, &item.SupplierID, &item.SupplierName,
		&item.PurchaseDate, &item.DiscountAmount, &item.TotalAmount, &item.PaymentStatus,
		&item.PaidAmount, &item.RemainingAmount, &item.UserName, &item.Notes,
	); err != nil {
		return nil, err
	}
	rows.Close()

	modelItems, err := r.GetItems(id)
	if err != nil {
		return nil, err
	}
	for _, mi := range modelItems {
		item.Items = append(item.Items, dto_purchase.PurchaseItemResponse{
			ID:            mi.ID,
			ProductID:     mi.ProductID,
			ProductName:   mi.ProductName,
			Quantity:      mi.Quantity,
			Unit:          mi.Unit,
			ConversionQty: mi.ConversionQty,
			PurchasePrice: mi.PurchasePrice,
			Subtotal:      mi.Subtotal,
		})
	}
	return &item, nil
}

func (r *purchaseRepo) GetRawByID(id int) (*model_purchase.Purchase, error) {
	var p model_purchase.Purchase
	result := r.db.Raw(getRawPurchaseByIDQuery, id).Scan(&p)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &p, nil
}

func (r *purchaseRepo) GetItems(purchaseID int) ([]model_purchase.PurchaseItem, error) {
	rows, err := r.db.Raw(getPurchaseItemsQuery, purchaseID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model_purchase.PurchaseItem
	for rows.Next() {
		var item model_purchase.PurchaseItem
		if err := rows.Scan(
			&item.ID, &item.ProductID, &item.ProductName,
			&item.Quantity, &item.Unit, &item.ConversionQty, &item.PurchasePrice, &item.Subtotal,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func (r *purchaseRepo) GetPayments(purchaseID int) ([]dto_purchase.PurchasePaymentResponse, error) {
	rows, err := r.db.Raw(getPaymentsQuery, purchaseID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []dto_purchase.PurchasePaymentResponse
	for rows.Next() {
		var item dto_purchase.PurchasePaymentResponse
		if err := rows.Scan(&item.ID, &item.PaymentDate, &item.Amount, &item.PaymentMethod, &item.Notes, &item.UserName, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if items == nil {
		items = []dto_purchase.PurchasePaymentResponse{}
	}
	return items, nil
}

func (r *purchaseRepo) GenerateCode() (string, error) {
	today := time.Now().Format("2006-01-02")
	var count int
	if err := r.db.Raw(generatePurchaseCodeQuery, today).Scan(&count).Error; err != nil {
		return "", err
	}
	return fmt.Sprintf("PO-%s-%03d", time.Now().Format("20060102"), count+1), nil
}

func (r *purchaseRepo) Create(req *dto_purchase.PurchaseRequest, userID int) (*dto_purchase.PurchaseResponse, error) {
	var purchaseID int

	err := r.db.Transaction(func(tx *gorm.DB) error {
		// 1. Generate purchase_code: PO-YYYYMMDD-XXX
		today := time.Now().Format("2006-01-02")
		var count int
		if err := tx.Raw(generatePurchaseCodeQuery, today).Scan(&count).Error; err != nil {
			return err
		}
		code := fmt.Sprintf("PO-%s-%03d", time.Now().Format("20060102"), count+1)

		// 2. Hitung total_amount
		var subtotal float64
		for _, item := range req.Items {
			subtotal += item.PurchasePrice * item.Quantity
		}
		totalAmount := subtotal - req.DiscountAmount
		if totalAmount < 0 {
			totalAmount = 0
		}

		// Tentukan payment_status dan paid_amount
		paymentStatus := req.PaymentStatus
		if paymentStatus == "" {
			paymentStatus = "unpaid"
		}
		paidAmount := req.PaidAmount
		switch paymentStatus {
		case "paid":
			paidAmount = totalAmount
		case "unpaid":
			paidAmount = 0
		}
		remainingAmount := totalAmount - paidAmount

		// 3. Simpan PO header
		if err := tx.Exec(createPurchaseQuery,
			code, req.InvoiceNumber, req.SupplierID, req.PurchaseDate,
			req.DiscountAmount, totalAmount, paymentStatus, paidAmount, remainingAmount, userID, req.Notes,
		).Error; err != nil {
			return err
		}

		if err := tx.Raw(`SELECT LAST_INSERT_ID()`).Scan(&purchaseID).Error; err != nil {
			return err
		}

		// 4. Catat pembayaran awal jika ada
		if paidAmount > 0 {
			paymentDate := req.PurchaseDate
			if paymentDate == "" {
				paymentDate = time.Now().Format("2006-01-02")
			}
			if err := tx.Exec(createPaymentQuery,
				purchaseID, paymentDate, paidAmount, req.PaymentMethod, req.Notes, userID,
			).Error; err != nil {
				return err
			}
		}

		// 5. Loop items
		for _, item := range req.Items {
			subtotal := item.PurchasePrice * item.Quantity

			// Normalisasi conversion_qty: default 1 jika tidak dikirim
			conversionQty := item.ConversionQty
			if conversionQty <= 0 {
				conversionQty = 1
			}
			// Stok yang ditambah = qty × conversion_qty (konversi ke satuan dasar)
			stockAdd := item.Quantity * conversionQty

			// Simpan item
			if err := tx.Exec(createPurchaseItemQuery,
				purchaseID, item.ProductID,
				item.Quantity, item.Unit, conversionQty, item.PurchasePrice, subtotal,
			).Error; err != nil {
				return err
			}

			// Ambil stok sebelum
			var stockBefore float64
			if err := tx.Raw(getProductStockQuery, item.ProductID).Scan(&stockBefore).Error; err != nil {
				return err
			}

			// Tambah stok dalam satuan dasar
			if err := tx.Exec(addStockQuery, stockAdd, item.ProductID).Error; err != nil {
				return err
			}

			// Catat mutasi stok (dalam satuan dasar)
			stockAfter := stockBefore + stockAdd
			notes := fmt.Sprintf("Purchase Order %s", code)
			if err := tx.Exec(createStockMutationQuery,
				item.ProductID, "in", stockAdd, stockBefore, stockAfter,
				"purchase", purchaseID, notes, userID,
			).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}
	return r.GetByID(purchaseID)
}

func (r *purchaseRepo) Update(id int, req *dto_purchase.PurchaseRequest) (*dto_purchase.PurchaseResponse, error) {
	err := r.db.Transaction(func(tx *gorm.DB) error {
		// Ambil items lama untuk rollback stok
		oldItems, err := r.GetItems(id)
		if err != nil {
			return err
		}

		// Rollback stok item lama (dalam satuan dasar)
		for _, item := range oldItems {
			convQty := item.ConversionQty
			if convQty <= 0 {
				convQty = 1
			}
			if err := tx.Exec(rollbackStockQuery, item.Quantity*convQty, item.ProductID).Error; err != nil {
				return err
			}
		}

		// Hapus items lama
		if err := tx.Exec(deletePurchaseItemsQuery, id).Error; err != nil {
			return err
		}

		// Hitung total baru
		var totalAmount float64
		for _, item := range req.Items {
			totalAmount += item.PurchasePrice * item.Quantity
		}

		// Update PO header
		if err := tx.Exec(
			`UPDATE purchases SET invoice_number=?, supplier_id=?, purchase_date=?, total_amount=?, remaining_amount=total_amount-paid_amount, notes=?, updated_at=NOW() WHERE id=?`,
			req.InvoiceNumber, req.SupplierID, req.PurchaseDate, totalAmount, req.Notes, id,
		).Error; err != nil {
			return err
		}

		// Insert items baru + update stok (dalam satuan dasar)
		for _, item := range req.Items {
			subtotal := item.PurchasePrice * item.Quantity
			conversionQty := item.ConversionQty
			if conversionQty <= 0 {
				conversionQty = 1
			}
			if err := tx.Exec(createPurchaseItemQuery,
				id, item.ProductID,
				item.Quantity, item.Unit, conversionQty, item.PurchasePrice, subtotal,
			).Error; err != nil {
				return err
			}
			if err := tx.Exec(addStockQuery, item.Quantity*conversionQty, item.ProductID).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}
	return r.GetByID(id)
}

func (r *purchaseRepo) Delete(id int) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		items, err := r.GetItems(id)
		if err != nil {
			return err
		}

		for _, item := range items {
			convQty := item.ConversionQty
			if convQty <= 0 {
				convQty = 1
			}
			if err := tx.Exec(rollbackStockQuery, item.Quantity*convQty, item.ProductID).Error; err != nil {
				return err
			}
		}

		if err := tx.Exec(deleteStockMutationsQuery, id).Error; err != nil {
			return err
		}

		if err := tx.Exec(deletePurchaseItemsQuery, id).Error; err != nil {
			return err
		}

		return tx.Exec(deletePurchaseQuery, id).Error
	})
}

func (r *purchaseRepo) IsValidPaymentMethod(code string) (bool, error) {
	var count int
	if err := r.db.Raw(validatePaymentMethodQuery, code).Scan(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *purchaseRepo) Pay(id int, req *dto_purchase.PayPurchaseRequest, userID int) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(payPurchaseQuery, req.Amount, req.Amount, req.Amount, req.Amount, id).Error; err != nil {
			return err
		}

		paymentDate := req.PaymentDate
		if paymentDate == "" {
			paymentDate = time.Now().Format("2006-01-02")
		}
		return tx.Exec(createPaymentQuery, id, paymentDate, req.Amount, req.PaymentMethod, req.Notes, userID).Error
	})
}
