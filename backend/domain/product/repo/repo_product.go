package repo_product

import (
	"fmt"
	"strings"

	dto_product "permen_api/domain/product/dto"
	model_product "permen_api/domain/product/model"

	"gorm.io/gorm"
)

const (
	getAllProductsBase = `
		SELECT p.id, p.barcode, p.name, p.category_id, COALESCE(c.name, '') as category_name,
		       p.purchase_price, p.selling_price, p.stock, p.min_stock, p.unit, p.is_active
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE 1=1`

	getProductByIDQuery = `
		SELECT p.id, p.barcode, p.name, p.category_id, p.purchase_price,
		       p.selling_price, p.stock, p.min_stock, p.unit, p.is_active, p.created_at, p.updated_at
		FROM products p WHERE p.id = ? LIMIT 1`

	getProductByBarcodeQuery = `
		SELECT p.id, p.barcode, p.name, p.category_id, p.purchase_price,
		       p.selling_price, p.stock, p.min_stock, p.unit, p.is_active, p.created_at, p.updated_at
		FROM products p WHERE p.barcode = ? LIMIT 1`

	searchProductsQuery = `
		SELECT id, barcode, name, selling_price, stock, unit
		FROM products WHERE is_active = 1
		AND (name LIKE ? OR barcode LIKE ?) LIMIT ?`

	getLowStockQuery = `
		SELECT id, name, stock, min_stock, unit
		FROM products WHERE stock <= min_stock AND is_active = 1`

	checkBarcodeExistsQuery  = `SELECT id FROM products WHERE barcode = ? AND id != ? LIMIT 1`
	checkProductUsedQuery    = `SELECT COUNT(*) FROM transaction_items WHERE product_id = ?`
	createProductQuery       = `INSERT INTO products (barcode, name, category_id, purchase_price, selling_price, stock, min_stock, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	updateProductQuery       = `UPDATE products SET barcode=?, name=?, category_id=?, purchase_price=?, selling_price=?, stock=?, min_stock=?, unit=?, updated_at=NOW() WHERE id=?`
	deleteProductQuery       = `DELETE FROM products WHERE id = ?`
	toggleProductStatusQuery = `UPDATE products SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?`
	updateProductStockQuery  = `UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?`
	countProductsBase        = `SELECT COUNT(*) FROM products p WHERE 1=1`
)

type productRepo struct {
	db *gorm.DB
}

func NewProductRepo(db *gorm.DB) ProductRepo {
	return &productRepo{db: db}
}

func (r *productRepo) GetAll(filter *dto_product.ProductFilter) ([]*dto_product.ProductResponse, int, error) {
	var args []interface{}
	var countArgs []interface{}
	conditions := ""
	countConditions := ""

	if filter.Search != "" {
		conditions += " AND (p.name LIKE ? OR p.barcode LIKE ?)"
		args = append(args, "%"+filter.Search+"%", "%"+filter.Search+"%")
		countConditions += " AND (p.name LIKE ? OR p.barcode LIKE ?)"
		countArgs = append(countArgs, "%"+filter.Search+"%", "%"+filter.Search+"%")
	}
	if filter.CategoryID != nil {
		conditions += " AND p.category_id = ?"
		args = append(args, *filter.CategoryID)
		countConditions += " AND p.category_id = ?"
		countArgs = append(countArgs, *filter.CategoryID)
	}
	if filter.IsActive != nil {
		val := 0
		if *filter.IsActive {
			val = 1
		}
		conditions += " AND p.is_active = ?"
		args = append(args, val)
		countConditions += " AND p.is_active = ?"
		countArgs = append(countArgs, val)
	}
	if filter.LowStock {
		conditions += " AND p.stock <= p.min_stock"
		countConditions += " AND p.stock <= p.min_stock"
	}

	// Count total
	var total int
	countQuery := countProductsBase + countConditions
	if err := r.db.Raw(countQuery, countArgs...).Scan(&total).Error; err != nil {
		return nil, 0, err
	}

	// Pagination
	page := filter.Page
	limit := filter.Limit
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := getAllProductsBase + conditions + fmt.Sprintf(" ORDER BY p.name LIMIT %d OFFSET %d", limit, offset)

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var products []*dto_product.ProductResponse
	for rows.Next() {
		var p dto_product.ProductResponse
		if err := rows.Scan(&p.ID, &p.Barcode, &p.Name, &p.CategoryID, &p.CategoryName,
			&p.PurchasePrice, &p.SellingPrice, &p.Stock, &p.MinStock, &p.Unit, &p.IsActive); err != nil {
			return nil, 0, err
		}
		products = append(products, &p)
	}
	if products == nil {
		products = []*dto_product.ProductResponse{}
	}
	return products, total, nil
}

func (r *productRepo) GetByID(id int) (*model_product.Product, error) {
	var p model_product.Product
	result := r.db.Raw(getProductByIDQuery, id).Scan(&p)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &p, nil
}

func (r *productRepo) GetByBarcode(barcode string) (*model_product.Product, error) {
	var p model_product.Product
	result := r.db.Raw(getProductByBarcodeQuery, barcode).Scan(&p)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &p, nil
}

func (r *productRepo) Search(keyword string, limit int) ([]*dto_product.ProductSearchResult, error) {
	like := "%" + keyword + "%"
	rows, err := r.db.Raw(searchProductsQuery, like, like, limit).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*dto_product.ProductSearchResult
	for rows.Next() {
		var p dto_product.ProductSearchResult
		if err := rows.Scan(&p.ID, &p.Barcode, &p.Name, &p.SellingPrice, &p.Stock, &p.Unit); err != nil {
			return nil, err
		}
		results = append(results, &p)
	}
	if results == nil {
		results = []*dto_product.ProductSearchResult{}
	}
	return results, nil
}

func (r *productRepo) GetLowStock() ([]*dto_product.LowStockProduct, error) {
	rows, err := r.db.Raw(getLowStockQuery).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*dto_product.LowStockProduct
	for rows.Next() {
		var p dto_product.LowStockProduct
		if err := rows.Scan(&p.ID, &p.Name, &p.Stock, &p.MinStock, &p.Unit); err != nil {
			return nil, err
		}
		results = append(results, &p)
	}
	if results == nil {
		results = []*dto_product.LowStockProduct{}
	}
	return results, nil
}

func (r *productRepo) CheckBarcodeExists(barcode string, excludeID int) (bool, error) {
	if strings.TrimSpace(barcode) == "" {
		return false, nil
	}
	var id int
	result := r.db.Raw(checkBarcodeExistsQuery, barcode, excludeID).Scan(&id)
	if result.Error != nil {
		return false, result.Error
	}
	return result.RowsAffected > 0, nil
}

func (r *productRepo) CountTransactionItems(productID int) (int, error) {
	var count int
	if err := r.db.Raw(checkProductUsedQuery, productID).Scan(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *productRepo) Create(req *dto_product.ProductRequest) (int64, error) {
	if err := r.db.Exec(createProductQuery,
		req.Barcode, req.Name, req.CategoryID, req.PurchasePrice,
		req.SellingPrice, req.Stock, req.MinStock, req.Unit,
	).Error; err != nil {
		return 0, err
	}
	var id int64
	if err := r.db.Raw(`SELECT LAST_INSERT_ID()`).Scan(&id).Error; err != nil {
		return 0, err
	}
	return id, nil
}

func (r *productRepo) Update(id int, req *dto_product.ProductRequest) error {
	return r.db.Exec(updateProductQuery,
		req.Barcode, req.Name, req.CategoryID, req.PurchasePrice,
		req.SellingPrice, req.Stock, req.MinStock, req.Unit, id,
	).Error
}

func (r *productRepo) Delete(id int) error {
	return r.db.Exec(deleteProductQuery, id).Error
}

func (r *productRepo) ToggleStatus(id int) error {
	return r.db.Exec(toggleProductStatusQuery, id).Error
}

func (r *productRepo) UpdateStock(id int, delta float64) error {
	return r.db.Exec(updateProductStockQuery, delta, id).Error
}
