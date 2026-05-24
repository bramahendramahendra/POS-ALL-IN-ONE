package repo_access

import (
	dto_access "pos_api/domain/access/dto"

	"gorm.io/gorm"
)

// getByRoleIDQuery mengambil semua menu beserta status akses role.
// LEFT JOIN agar menu yang belum punya access row tetap muncul dengan default false.
const getByRoleIDQuery = `
SELECT
    m.id         AS menu_id,
    m.key_name,
    m.label,
    m.parent_id,
    COALESCE(rma.can_view,   0) AS can_view,
    COALESCE(rma.can_create, 0) AS can_create,
    COALESCE(rma.can_edit,   0) AS can_edit,
    COALESCE(rma.can_delete, 0) AS can_delete
FROM menus m
LEFT JOIN role_menu_access rma ON rma.menu_id = m.id AND rma.role_id = ?
WHERE m.is_active = 1
ORDER BY m.order_index ASC, m.id ASC
`

// upsertAccessQuery menyimpan atau update satu baris akses menggunakan ON DUPLICATE KEY.
const upsertAccessQuery = `
INSERT INTO role_menu_access (role_id, menu_id, can_view, can_create, can_edit, can_delete)
VALUES (?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
    can_view   = VALUES(can_view),
    can_create = VALUES(can_create),
    can_edit   = VALUES(can_edit),
    can_delete = VALUES(can_delete),
    updated_at = NOW()
`

const deleteRoleAccessQuery = `DELETE FROM role_menu_access WHERE role_id = ?`

type accessRepo struct {
	db *gorm.DB
}

func NewAccessRepo(db *gorm.DB) AccessRepo {
	return &accessRepo{db: db}
}

func (r *accessRepo) GetByRoleID(roleID int) ([]*dto_access.RoleMenuAccessItem, error) {
	rows, err := r.db.Raw(getByRoleIDQuery, roleID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*dto_access.RoleMenuAccessItem
	for rows.Next() {
		var item dto_access.RoleMenuAccessItem
		if err := rows.Scan(&item.MenuID, &item.KeyName, &item.Label, &item.ParentID,
			&item.CanView, &item.CanCreate, &item.CanEdit, &item.CanDelete); err != nil {
			return nil, err
		}
		items = append(items, &item)
	}
	return items, nil
}

// SetRoleAccess mengganti seluruh akses role: hapus lama, upsert baru.
// Menggunakan transaksi agar atomik.
func (r *accessRepo) SetRoleAccess(roleID int, accesses []dto_access.SetAccessItem) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(deleteRoleAccessQuery, roleID).Error; err != nil {
			return err
		}
		for _, a := range accesses {
			if err := tx.Exec(upsertAccessQuery,
				roleID, a.MenuID, a.CanView, a.CanCreate, a.CanEdit, a.CanDelete,
			).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
