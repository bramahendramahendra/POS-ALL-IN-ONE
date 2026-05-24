package repo_menu

import (
	"strings"

	dto_menu "pos_api/domain/menu/dto"
	model_menu "pos_api/domain/menu/model"

	"gorm.io/gorm"
)

const (
	getMenuByIDQuery      = `SELECT id, parent_id, key_name, label, icon, path, order_index, is_active, created_at, updated_at FROM menus WHERE id = ? LIMIT 1`
	getMenuByKeyNameQuery = `SELECT id, parent_id, key_name, label, icon, path, order_index, is_active, created_at, updated_at FROM menus WHERE key_name = ? LIMIT 1`
	createMenuQuery       = `INSERT INTO menus (parent_id, key_name, label, icon, path, order_index) VALUES (?, ?, ?, ?, ?, ?)`
	updateMenuQuery       = `UPDATE menus SET parent_id = ?, label = ?, icon = ?, path = ?, order_index = ?, updated_at = NOW() WHERE id = ?`
	deleteMenuQuery       = `DELETE FROM menus WHERE id = ?`
	updateOrderQuery      = `UPDATE menus SET order_index = ?, updated_at = NOW() WHERE id = ?`
)

// getMyMenusQuery mengambil semua menu yang boleh diakses role tertentu beserta permission-nya.
// Hasil flat — tree dibangun di service.
const getMyMenusQuery = `
SELECT
    m.id,
    m.parent_id,
    m.key_name,
    m.label,
    m.icon,
    m.path,
    m.order_index,
    rma.can_view,
    rma.can_create,
    rma.can_edit,
    rma.can_delete
FROM menus m
INNER JOIN role_menu_access rma ON rma.menu_id = m.id
INNER JOIN roles r              ON r.id = rma.role_id
WHERE r.name = ?
  AND r.is_active = 1
  AND m.is_active = 1
  AND rma.can_view = 1
ORDER BY m.order_index ASC, m.id ASC
`

type menuRepo struct {
	db *gorm.DB
}

func NewMenuRepo(db *gorm.DB) MenuRepo {
	return &menuRepo{db: db}
}

func (r *menuRepo) GetAll(filter *dto_menu.MenuListFilter) ([]*model_menu.Menu, error) {
	query := `SELECT id, parent_id, key_name, label, icon, path, order_index, is_active, created_at, updated_at FROM menus WHERE 1=1`
	args := []any{}

	if filter.Search != "" {
		safe := "%" + strings.ReplaceAll(filter.Search, "%", `\%`) + "%"
		query += ` AND (key_name LIKE ? OR label LIKE ?)`
		args = append(args, safe, safe)
	}
	if filter.IsActive != nil {
		query += ` AND is_active = ?`
		args = append(args, *filter.IsActive)
	}

	query += ` ORDER BY order_index ASC, id ASC`

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var menus []*model_menu.Menu
	for rows.Next() {
		var m model_menu.Menu
		if err := rows.Scan(&m.ID, &m.ParentID, &m.KeyName, &m.Label, &m.Icon,
			&m.Path, &m.OrderIndex, &m.IsActive, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		menus = append(menus, &m)
	}
	return menus, nil
}

func (r *menuRepo) GetByID(id int) (*model_menu.Menu, error) {
	var m model_menu.Menu
	result := r.db.Raw(getMenuByIDQuery, id).Scan(&m)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &m, nil
}

func (r *menuRepo) GetByKeyName(keyName string) (*model_menu.Menu, error) {
	var m model_menu.Menu
	result := r.db.Raw(getMenuByKeyNameQuery, keyName).Scan(&m)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &m, nil
}

// GetMyMenus mengambil semua menu yang boleh diakses role, dikembalikan flat.
// Tree dibangun di service agar repo tetap sederhana.
func (r *menuRepo) GetMyMenus(roleName string) ([]*dto_menu.MyMenuItem, error) {
	type rawRow struct {
		ID         int
		ParentID   *int
		KeyName    string
		Label      string
		Icon       *string
		Path       *string
		OrderIndex int
		CanView    bool
		CanCreate  bool
		CanEdit    bool
		CanDelete  bool
	}

	rows, err := r.db.Raw(getMyMenusQuery, roleName).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*dto_menu.MyMenuItem
	for rows.Next() {
		var row rawRow
		if err := rows.Scan(&row.ID, &row.ParentID, &row.KeyName, &row.Label, &row.Icon,
			&row.Path, &row.OrderIndex, &row.CanView, &row.CanCreate, &row.CanEdit, &row.CanDelete); err != nil {
			return nil, err
		}
		items = append(items, &dto_menu.MyMenuItem{
			KeyName:    row.KeyName,
			Label:      row.Label,
			Icon:       row.Icon,
			Path:       row.Path,
			OrderIndex: row.OrderIndex,
			Permission: dto_menu.MenuPermission{
				CanView:   row.CanView,
				CanCreate: row.CanCreate,
				CanEdit:   row.CanEdit,
				CanDelete: row.CanDelete,
			},
			Children: []dto_menu.MyMenuItem{},
		})
	}
	return items, nil
}

func (r *menuRepo) Create(req *dto_menu.CreateMenuRequest) (int64, error) {
	var icon, path *string
	if req.Icon != "" {
		icon = &req.Icon
	}
	if req.Path != "" {
		path = &req.Path
	}

	res := r.db.Exec(createMenuQuery, req.ParentID, req.KeyName, req.Label, icon, path, req.OrderIndex)
	if res.Error != nil {
		return 0, res.Error
	}

	var id int64
	if err := r.db.Raw(`SELECT LAST_INSERT_ID()`).Scan(&id).Error; err != nil {
		return 0, err
	}
	return id, nil
}

func (r *menuRepo) Update(id int, req *dto_menu.UpdateMenuRequest) error {
	var icon, path *string
	if req.Icon != "" {
		icon = &req.Icon
	}
	if req.Path != "" {
		path = &req.Path
	}
	return r.db.Exec(updateMenuQuery, req.ParentID, req.Label, icon, path, req.OrderIndex, id).Error
}

func (r *menuRepo) Delete(id int) error {
	return r.db.Exec(deleteMenuQuery, id).Error
}

func (r *menuRepo) Reorder(items []dto_menu.ReorderItem) error {
	for _, item := range items {
		if err := r.db.Exec(updateOrderQuery, item.OrderIndex, item.ID).Error; err != nil {
			return err
		}
	}
	return nil
}
