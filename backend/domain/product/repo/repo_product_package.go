package repo_product

import (
	dto_product "pos_api/domain/product/dto"

	"gorm.io/gorm"
)

const (
	getProductPackagesQuery       = `SELECT pp.id, pp.product_id, pp.unit_id, COALESCE(u.name, '') AS unit_name, COALESCE(u.abbreviation, '') AS abbreviation, COALESCE(pp.package_name, '') AS package_name, pp.conversion_qty, pp.purchase_price, pp.selling_price, pp.is_default FROM product_packages pp JOIN units u ON u.id = pp.unit_id WHERE pp.product_id = ?`
	deleteProductPackagesQuery    = `DELETE FROM product_packages WHERE product_id = ?`
	insertProductPackageQuery     = `INSERT INTO product_packages (product_id, unit_id, package_name, conversion_qty, purchase_price, selling_price, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)`
	deleteProductPackageByIDQuery = `DELETE FROM product_packages WHERE id = ? AND product_id = ?`
)

type ProductPackageRepo interface {
	GetByProduct(productID int) ([]*dto_product.ProductPackageResponse, error)
	Save(productID int, packages []dto_product.ProductPackageRequest) error
	DeleteOne(id, productID int) error
}

type productPackageRepo struct {
	db *gorm.DB
}

func NewProductPackageRepo(db *gorm.DB) ProductPackageRepo {
	return &productPackageRepo{db: db}
}

func (r *productPackageRepo) GetByProduct(productID int) ([]*dto_product.ProductPackageResponse, error) {
	rows, err := r.db.Raw(getProductPackagesQuery, productID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var packages []*dto_product.ProductPackageResponse
	for rows.Next() {
		var p dto_product.ProductPackageResponse
		if err := rows.Scan(&p.ID, &p.ProductID, &p.UnitID, &p.UnitName, &p.Abbreviation, &p.PackageName, &p.ConversionQty, &p.PurchasePrice, &p.SellingPrice, &p.IsDefault); err != nil {
			return nil, err
		}
		packages = append(packages, &p)
	}
	if packages == nil {
		packages = []*dto_product.ProductPackageResponse{}
	}
	return packages, nil
}

func (r *productPackageRepo) Save(productID int, packages []dto_product.ProductPackageRequest) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(deleteProductPackagesQuery, productID).Error; err != nil {
			return err
		}
		for _, p := range packages {
			var pkgName *string
			if p.PackageName != "" {
				pkgName = &p.PackageName
			}
			if err := tx.Exec(insertProductPackageQuery,
				productID, p.UnitID, pkgName, p.ConversionQty, p.PurchasePrice, p.SellingPrice, p.IsDefault,
			).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *productPackageRepo) DeleteOne(id, productID int) error {
	return r.db.Exec(deleteProductPackageByIDQuery, id, productID).Error
}
