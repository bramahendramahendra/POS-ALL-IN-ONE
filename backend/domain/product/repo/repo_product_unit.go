package repo_product

import (
	dto_product "permen_api/domain/product/dto"

	"gorm.io/gorm"
)

const (
	getProductUnitsQuery      = `SELECT pu.id, pu.product_id, pu.unit_id, pu.unit_name, pu.conversion_qty, pu.selling_price, pu.is_default FROM product_units pu WHERE pu.product_id = ?`
	deleteProductUnitsQuery   = `DELETE FROM product_units WHERE product_id = ?`
	insertProductUnitQuery    = `INSERT INTO product_units (product_id, unit_id, unit_name, conversion_qty, selling_price, is_default) VALUES (?, ?, ?, ?, ?, ?)`
	deleteProductUnitByIDQuery = `DELETE FROM product_units WHERE id = ? AND product_id = ?`
)

type ProductUnitRepo interface {
	GetByProduct(productID int) ([]*dto_product.ProductUnitResponse, error)
	Save(productID int, units []dto_product.ProductUnitRequest) error
	DeleteOne(id, productID int) error
}

type productUnitRepo struct {
	db *gorm.DB
}

func NewProductUnitRepo(db *gorm.DB) ProductUnitRepo {
	return &productUnitRepo{db: db}
}

func (r *productUnitRepo) GetByProduct(productID int) ([]*dto_product.ProductUnitResponse, error) {
	rows, err := r.db.Raw(getProductUnitsQuery, productID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var units []*dto_product.ProductUnitResponse
	for rows.Next() {
		var u dto_product.ProductUnitResponse
		if err := rows.Scan(&u.ID, &u.ProductID, &u.UnitID, &u.UnitName, &u.ConversionQty, &u.SellingPrice, &u.IsDefault); err != nil {
			return nil, err
		}
		units = append(units, &u)
	}
	if units == nil {
		units = []*dto_product.ProductUnitResponse{}
	}
	return units, nil
}

func (r *productUnitRepo) Save(productID int, units []dto_product.ProductUnitRequest) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(deleteProductUnitsQuery, productID).Error; err != nil {
			return err
		}
		for _, u := range units {
			if err := tx.Exec(insertProductUnitQuery,
				productID, u.UnitID, u.UnitName, u.ConversionQty, u.SellingPrice, u.IsDefault,
			).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *productUnitRepo) DeleteOne(id, productID int) error {
	return r.db.Exec(deleteProductUnitByIDQuery, id, productID).Error
}
