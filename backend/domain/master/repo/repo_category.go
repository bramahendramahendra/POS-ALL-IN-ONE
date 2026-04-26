package repo_master

import (
	model_master "permen_api/domain/master/model"

	"gorm.io/gorm"
)

const (
	getAllCategoriesQuery    = `SELECT id, name, description, created_at FROM categories ORDER BY name`
	getCategoryByIDQuery    = `SELECT id, name, description, created_at FROM categories WHERE id = ? LIMIT 1`
	getCategoryByNameQuery  = `SELECT id, name, description, created_at FROM categories WHERE name = ? LIMIT 1`
	checkCategoryNameQuery  = `SELECT id FROM categories WHERE name = ? AND id != ? LIMIT 1`
	checkCategoryUsedQuery = `SELECT COUNT(*) FROM products WHERE category_id = ?`
	createCategoryQuery   = `INSERT INTO categories (name, description) VALUES (?, ?)`
	updateCategoryQuery   = `UPDATE categories SET name = ?, description = ?, updated_at = NOW() WHERE id = ?`
	deleteCategoryQuery   = `DELETE FROM categories WHERE id = ?`
)

type categoryRepo struct {
	db *gorm.DB
}

func NewCategoryRepo(db *gorm.DB) CategoryRepo {
	return &categoryRepo{db: db}
}

func (r *categoryRepo) GetAll() ([]*model_master.Category, error) {
	rows, err := r.db.Raw(getAllCategoriesQuery).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []*model_master.Category
	for rows.Next() {
		var c model_master.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Description, &c.CreatedAt); err != nil {
			return nil, err
		}
		categories = append(categories, &c)
	}
	return categories, nil
}

func (r *categoryRepo) GetByName(name string) (*model_master.Category, error) {
	var c model_master.Category
	result := r.db.Raw(getCategoryByNameQuery, name).Scan(&c)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &c, nil
}

func (r *categoryRepo) GetByID(id int) (*model_master.Category, error) {
	var c model_master.Category
	result := r.db.Raw(getCategoryByIDQuery, id).Scan(&c)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &c, nil
}

func (r *categoryRepo) CheckNameExists(name string, excludeID int) (bool, error) {
	var id int
	result := r.db.Raw(checkCategoryNameQuery, name, excludeID).Scan(&id)
	if result.Error != nil {
		return false, result.Error
	}
	return result.RowsAffected > 0, nil
}

func (r *categoryRepo) CountProductsByCategory(categoryID int) (int, error) {
	var count int
	if err := r.db.Raw(checkCategoryUsedQuery, categoryID).Scan(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *categoryRepo) Create(name, description string) (int64, error) {
	if err := r.db.Exec(createCategoryQuery, name, description).Error; err != nil {
		return 0, err
	}
	var id int64
	if err := r.db.Raw(`SELECT LAST_INSERT_ID()`).Scan(&id).Error; err != nil {
		return 0, err
	}
	return id, nil
}

func (r *categoryRepo) Update(id int, name, description string) error {
	return r.db.Exec(updateCategoryQuery, name, description, id).Error
}

func (r *categoryRepo) Delete(id int) error {
	return r.db.Exec(deleteCategoryQuery, id).Error
}
