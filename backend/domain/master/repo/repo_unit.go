package repo_master

import (
	model_master "permen_api/domain/master/model"

	"gorm.io/gorm"
)

const (
	getAllUnitsQuery      = `SELECT id, name, abbreviation, is_active FROM units ORDER BY name`
	getActiveUnitsQuery  = `SELECT id, name, abbreviation, is_active FROM units WHERE is_active = 1 ORDER BY name`
	getUnitByIDQuery     = `SELECT id, name, abbreviation, is_active FROM units WHERE id = ? LIMIT 1`
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

func (r *unitRepo) GetAll() ([]*model_master.Unit, error) {
	rows, err := r.db.Raw(getAllUnitsQuery).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var units []*model_master.Unit
	for rows.Next() {
		var u model_master.Unit
		if err := rows.Scan(&u.ID, &u.Name, &u.Abbreviation, &u.IsActive); err != nil {
			return nil, err
		}
		units = append(units, &u)
	}
	return units, nil
}

func (r *unitRepo) GetActive() ([]*model_master.Unit, error) {
	rows, err := r.db.Raw(getActiveUnitsQuery).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var units []*model_master.Unit
	for rows.Next() {
		var u model_master.Unit
		if err := rows.Scan(&u.ID, &u.Name, &u.Abbreviation, &u.IsActive); err != nil {
			return nil, err
		}
		units = append(units, &u)
	}
	return units, nil
}

func (r *unitRepo) GetByID(id int) (*model_master.Unit, error) {
	var u model_master.Unit
	result := r.db.Raw(getUnitByIDQuery, id).Scan(&u)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &u, nil
}

func (r *unitRepo) CountProductUnitsByUnit(unitID int) (int, error) {
	var count int
	if err := r.db.Raw(checkUnitUsedQuery, unitID).Scan(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *unitRepo) Create(name, abbreviation string) (int64, error) {
	if err := r.db.Exec(createUnitQuery, name, abbreviation).Error; err != nil {
		return 0, err
	}
	var id int64
	if err := r.db.Raw(`SELECT LAST_INSERT_ID()`).Scan(&id).Error; err != nil {
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
