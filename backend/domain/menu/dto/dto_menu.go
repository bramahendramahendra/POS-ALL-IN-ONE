package dto_menu

import "time"

type CreateMenuRequest struct {
	ParentID   *int    `json:"parent_id"`
	KeyName    string  `json:"key_name"    validate:"required,min=2"`
	Label      string  `json:"label"       validate:"required"`
	Icon       string  `json:"icon"`
	Path       string  `json:"path"`
	OrderIndex int     `json:"order_index"`
}

type UpdateMenuRequest struct {
	ParentID   *int    `json:"parent_id"`
	Label      string  `json:"label"       validate:"required"`
	Icon       string  `json:"icon"`
	Path       string  `json:"path"`
	OrderIndex int     `json:"order_index"`
}

type ReorderItem struct {
	ID         int `json:"id"          validate:"required,gt=0"`
	OrderIndex int `json:"order_index"`
}

type ReorderRequest struct {
	Items []ReorderItem `json:"items" validate:"required,min=1,dive"`
}

// MenuResponse digunakan untuk list admin (flat, tanpa children)
type MenuResponse struct {
	ID         int        `json:"id"`
	ParentID   *int       `json:"parent_id"`
	KeyName    string     `json:"key_name"`
	Label      string     `json:"label"`
	Icon       *string    `json:"icon"`
	Path       *string    `json:"path"`
	OrderIndex int        `json:"order_index"`
	IsActive   bool       `json:"is_active"`
	CreatedAt  time.Time  `json:"created_at"`
}

// MenuPermission adalah permission user untuk satu menu
type MenuPermission struct {
	CanView   bool `json:"can_view"`
	CanCreate bool `json:"can_create"`
	CanEdit   bool `json:"can_edit"`
	CanDelete bool `json:"can_delete"`
}

// MyMenuItem adalah item menu yang dikembalikan ke user yang sedang login (tree)
type MyMenuItem struct {
	KeyName    string         `json:"key_name"`
	Label      string         `json:"label"`
	Icon       *string        `json:"icon"`
	Path       *string        `json:"path"`
	OrderIndex int            `json:"order_index"`
	Permission MenuPermission `json:"permission"`
	Children   []MyMenuItem   `json:"children"`
}

type MenuListFilter struct {
	Search   string
	IsActive *bool
}
