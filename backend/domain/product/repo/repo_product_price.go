package repo_product

import (
	dto_product "permen_api/domain/product/dto"

	"gorm.io/gorm"
)

const (
	getProductPricesQuery    = `SELECT id, product_id, tier_name, min_qty, price FROM product_prices WHERE product_id = ? ORDER BY min_qty`
	deleteProductPricesQuery = `DELETE FROM product_prices WHERE product_id = ?`
	insertProductPriceQuery  = `INSERT INTO product_prices (product_id, tier_name, min_qty, price) VALUES (?, ?, ?, ?)`
)

type ProductPriceRepo interface {
	GetByProduct(productID int) ([]*dto_product.ProductPriceResponse, error)
	Save(productID int, prices []dto_product.ProductPriceRequest) error
}

type productPriceRepo struct {
	db *gorm.DB
}

func NewProductPriceRepo(db *gorm.DB) ProductPriceRepo {
	return &productPriceRepo{db: db}
}

func (r *productPriceRepo) GetByProduct(productID int) ([]*dto_product.ProductPriceResponse, error) {
	rows, err := r.db.Raw(getProductPricesQuery, productID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var prices []*dto_product.ProductPriceResponse
	for rows.Next() {
		var p dto_product.ProductPriceResponse
		if err := rows.Scan(&p.ID, &p.ProductID, &p.TierName, &p.MinQty, &p.Price); err != nil {
			return nil, err
		}
		prices = append(prices, &p)
	}
	if prices == nil {
		prices = []*dto_product.ProductPriceResponse{}
	}
	return prices, nil
}

func (r *productPriceRepo) Save(productID int, prices []dto_product.ProductPriceRequest) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(deleteProductPricesQuery, productID).Error; err != nil {
			return err
		}
		for _, p := range prices {
			if err := tx.Exec(insertProductPriceQuery,
				productID, p.TierName, p.MinQty, p.Price,
			).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
