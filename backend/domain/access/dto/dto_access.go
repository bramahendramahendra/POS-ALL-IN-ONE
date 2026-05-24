package dto_access

// RoleMenuAccessItem adalah satu baris akses menu untuk sebuah role
type RoleMenuAccessItem struct {
	MenuID    int  `json:"menu_id"`
	KeyName   string `json:"key_name"`
	Label     string `json:"label"`
	ParentID  *int   `json:"parent_id"`
	CanView   bool `json:"can_view"`
	CanCreate bool `json:"can_create"`
	CanEdit   bool `json:"can_edit"`
	CanDelete bool `json:"can_delete"`
}

// SetAccessItem adalah payload untuk satu menu saat menyimpan akses
type SetAccessItem struct {
	MenuID    int  `json:"menu_id"    validate:"required,gt=0"`
	CanView   bool `json:"can_view"`
	CanCreate bool `json:"can_create"`
	CanEdit   bool `json:"can_edit"`
	CanDelete bool `json:"can_delete"`
}

// SetRoleAccessRequest adalah payload lengkap untuk PUT /roles/:id/menus
type SetRoleAccessRequest struct {
	Accesses []SetAccessItem `json:"accesses" validate:"required,min=1,dive"`
}
