package repo_stock_mutation

import (
	"fmt"

	dto_stock_mutation "permen_api/domain/stock_mutation/dto"

	"gorm.io/gorm"
)

const (
	getAllMutationsQuery = `
		SELECT sm.id, sm.product_id, p.name as product_name, sm.mutation_type,
		       sm.quantity, sm.stock_before, sm.stock_after, sm.reference_type,
		       sm.reference_id, sm.notes, u.full_name as user_name, sm.created_at
		FROM stock_mutations sm
		LEFT JOIN products p ON sm.product_id = p.id
		LEFT JOIN users u ON sm.user_id = u.id
		WHERE 1=1`

	countMutationsBase = `SELECT COUNT(*) FROM stock_mutations sm WHERE 1=1`

	getMutationsByProductQuery = `
		SELECT sm.id, sm.mutation_type, sm.quantity, sm.stock_before, sm.stock_after,
		       sm.reference_type, sm.reference_id, sm.notes, u.full_name as user_name, sm.created_at
		FROM stock_mutations sm
		LEFT JOIN users u ON sm.user_id = u.id
		WHERE sm.product_id = ?
		ORDER BY sm.created_at DESC`
)

type stockMutationRepo struct {
	db *gorm.DB
}

func NewStockMutationRepo(db *gorm.DB) StockMutationRepo {
	return &stockMutationRepo{db: db}
}

func (r *stockMutationRepo) GetAll(filter *dto_stock_mutation.StockMutationFilter) ([]*dto_stock_mutation.StockMutationResponse, int, error) {
	var args, countArgs []interface{}
	conditions := ""

	if filter.ProductID != nil {
		conditions += " AND sm.product_id = ?"
		args = append(args, *filter.ProductID)
		countArgs = append(countArgs, *filter.ProductID)
	}
	if filter.MutationType != "" {
		conditions += " AND sm.mutation_type = ?"
		args = append(args, filter.MutationType)
		countArgs = append(countArgs, filter.MutationType)
	}
	if filter.ReferenceType != "" {
		conditions += " AND sm.reference_type = ?"
		args = append(args, filter.ReferenceType)
		countArgs = append(countArgs, filter.ReferenceType)
	}
	if filter.DateFrom != "" {
		conditions += " AND DATE(sm.created_at) >= ?"
		args = append(args, filter.DateFrom)
		countArgs = append(countArgs, filter.DateFrom)
	}
	if filter.DateTo != "" {
		conditions += " AND DATE(sm.created_at) <= ?"
		args = append(args, filter.DateTo)
		countArgs = append(countArgs, filter.DateTo)
	}

	var total int
	if err := r.db.Raw(countMutationsBase+conditions, countArgs...).Scan(&total).Error; err != nil {
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

	query := getAllMutationsQuery + conditions + fmt.Sprintf(" ORDER BY sm.created_at DESC LIMIT %d OFFSET %d", limit, offset)

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []*dto_stock_mutation.StockMutationResponse
	for rows.Next() {
		var item dto_stock_mutation.StockMutationResponse
		if err := rows.Scan(
			&item.ID, &item.ProductID, &item.ProductName, &item.MutationType,
			&item.Quantity, &item.StockBefore, &item.StockAfter, &item.ReferenceType,
			&item.ReferenceID, &item.Notes, &item.UserName, &item.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, &item)
	}
	if items == nil {
		items = []*dto_stock_mutation.StockMutationResponse{}
	}
	return items, total, nil
}

func (r *stockMutationRepo) GetByProduct(productID int) ([]*dto_stock_mutation.StockMutationByProductResponse, error) {
	rows, err := r.db.Raw(getMutationsByProductQuery, productID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*dto_stock_mutation.StockMutationByProductResponse
	for rows.Next() {
		var item dto_stock_mutation.StockMutationByProductResponse
		if err := rows.Scan(
			&item.ID, &item.MutationType, &item.Quantity, &item.StockBefore, &item.StockAfter,
			&item.ReferenceType, &item.ReferenceID, &item.Notes, &item.UserName, &item.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, &item)
	}
	if items == nil {
		items = []*dto_stock_mutation.StockMutationByProductResponse{}
	}
	return items, nil
}
