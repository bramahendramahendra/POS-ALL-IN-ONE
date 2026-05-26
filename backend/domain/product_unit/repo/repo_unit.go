package repo_product_unit

import (
	model_product_unit "pos_api/domain/product_unit/model"

	"gorm.io/gorm"
)

const (
	getAllUnitsQuery      = `SELECT id, name, abbreviation, is_active FROM units ORDER BY name`
	getActiveUnitsQuery  = `SELECT id, name, abbreviation, is_active FROM units WHERE is_active = 1 ORDER BY name`
	getUnitByIDQuery     = `SELECT id, name, abbreviation, is_active FROM units WHERE id = ? LIMIT 1`
	checkUnitNameQuery   = `SELECT id FROM units WHERE name = ? AND id != ? LIMIT 1`
	checkUnitUsedQuery   = `SELECT COUNT(*) FROM product_units WHERE unit_id = ?`
	createUnitQuery      = `INSERT INTO units (name, abbreviation) VALUES (?, ?)`
	updateUnitQuery      = `UPDATE units SET name = ?, abbreviation = ?, updated_at = NOW() WHERE id = ?`
	deleteUnitQuery      = `DELETE FROM units WHERE id = ?`
	toggleUnitStatusQuery = `UPDATE units SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?`
)

type unitRepo struct {
	db *gorm.DB
}

func NewUnitRepo(db *gorm.DB) UnitRepo {
	return &unitRepo{db: db}
}

func (r *unitRepo) GetAll() ([]*model_product_unit.Unit, error) {
	rows, err := r.db.Raw(getAllUnitsQuery).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	units := make([]*model_product_unit.Unit, 0)
	for rows.Next() {
		var u model_product_unit.Unit
		if err := rows.Scan(&u.ID, &u.Name, &u.Abbreviation, &u.IsActive); err != nil {
			return nil, err
		}
		units = append(units, &u)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return units, nil
}

func (r *unitRepo) GetActive() ([]*model_product_unit.Unit, error) {
	rows, err := r.db.Raw(getActiveUnitsQuery).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	units := make([]*model_product_unit.Unit, 0)
	for rows.Next() {
		var u model_product_unit.Unit
		if err := rows.Scan(&u.ID, &u.Name, &u.Abbreviation, &u.IsActive); err != nil {
			return nil, err
		}
		units = append(units, &u)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return units, nil
}

func (r *unitRepo) GetByID(id int) (*model_product_unit.Unit, error) {
	var u model_product_unit.Unit
	result := r.db.Raw(getUnitByIDQuery, id).Scan(&u)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &u, nil
}

func (r *unitRepo) CheckNameExists(name string, excludeID int) (bool, error) {
	var id int
	result := r.db.Raw(checkUnitNameQuery, name, excludeID).Scan(&id)
	if result.Error != nil {
		return false, result.Error
	}
	return result.RowsAffected > 0, nil
}

func (r *unitRepo) CountProductUnitsByUnit(unitID int) (int, error) {
	var count int
	if err := r.db.Raw(checkUnitUsedQuery, unitID).Scan(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *unitRepo) Create(name, abbreviation string) (int64, error) {
	var id int64
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(createUnitQuery, name, abbreviation).Error; err != nil {
			return err
		}
		return tx.Raw(`SELECT LAST_INSERT_ID()`).Scan(&id).Error
	})
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (r *unitRepo) Update(id int, name, abbreviation string) error {
	return r.db.Exec(updateUnitQuery, name, abbreviation, id).Error
}

func (r *unitRepo) Delete(id int) error {
	return r.db.Exec(deleteUnitQuery, id).Error
}

func (r *unitRepo) ToggleStatus(id int) error {
	return r.db.Exec(toggleUnitStatusQuery, id).Error
}
