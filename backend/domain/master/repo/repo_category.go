package repo_master

import (
	"fmt"
	"strings"
	"unicode"

	model_master "pos_api/domain/master/model"

	"gorm.io/gorm"
)

const (
	getAllCategoriesQuery  = `SELECT c.id, c.name, COALESCE(c.code, '') as code, c.description, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count, c.created_at FROM categories c ORDER BY c.name`
	getCategoryByIDQuery   = `SELECT c.id, c.name, COALESCE(c.code, '') as code, c.description, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count, c.created_at FROM categories c WHERE c.id = ? LIMIT 1`
	getCategoryByNameQuery = `SELECT id, name, COALESCE(code, '') as code, description, created_at FROM categories WHERE name = ? LIMIT 1`
	checkCategoryNameQuery = `SELECT id FROM categories WHERE name = ? AND id != ? LIMIT 1`
	checkCategoryCodeQuery = `SELECT id FROM categories WHERE code = ? LIMIT 1`
	checkCategoryUsedQuery = `SELECT COUNT(*) FROM products WHERE category_id = ?`
	createCategoryQuery    = `INSERT INTO categories (name, code, description) VALUES (?, ?, ?)`
	updateCategoryQuery    = `UPDATE categories SET name = ?, description = ?, updated_at = NOW() WHERE id = ?`
	deleteCategoryQuery    = `DELETE FROM categories WHERE id = ?`
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

	categories := make([]*model_master.Category, 0)
	for rows.Next() {
		var c model_master.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Code, &c.Description, &c.ProductCount, &c.CreatedAt); err != nil {
			return nil, err
		}
		categories = append(categories, &c)
	}
	if err := rows.Err(); err != nil {
		return nil, err
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

func (r *categoryRepo) CreateWithGeneratedCode(name, description string) (int64, error) {
	code, err := r.generateUniqueCode(name)
	if err != nil {
		return 0, err
	}
	return r.Create(name, code, description)
}

func (r *categoryRepo) generateUniqueCode(name string) (string, error) {
	letters := strings.Map(func(ru rune) rune {
		if unicode.IsLetter(ru) {
			return unicode.ToUpper(ru)
		}
		return -1
	}, name)
	base := letters
	if len(base) > 3 {
		base = base[:3]
	}
	for len(base) < 3 {
		base += "X"
	}
	candidate := base
	for i := 2; i <= 99; i++ {
		exists, err := r.CheckCodeExists(candidate)
		if err != nil {
			return "", err
		}
		if !exists {
			return candidate, nil
		}
		candidate = fmt.Sprintf("%s%d", base, i)
	}
	return "", fmt.Errorf("tidak bisa generate kode kategori yang unik")
}

func (r *categoryRepo) CheckCodeExists(code string) (bool, error) {
	var id int
	result := r.db.Raw(checkCategoryCodeQuery, code).Scan(&id)
	if result.Error != nil {
		return false, result.Error
	}
	return result.RowsAffected > 0, nil
}

func (r *categoryRepo) Create(name, code, description string) (int64, error) {
	var id int64
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(createCategoryQuery, name, code, description).Error; err != nil {
			return err
		}
		return tx.Raw(`SELECT LAST_INSERT_ID()`).Scan(&id).Error
	})
	if err != nil {
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
