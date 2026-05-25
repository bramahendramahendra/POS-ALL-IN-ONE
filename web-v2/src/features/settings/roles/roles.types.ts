export interface Role {
  id: number
  name: string
  display_name: string
  description: string | null
  is_system: boolean
  is_active: boolean
  created_at: string
}

export interface CreateRolePayload {
  name: string
  display_name: string
  description?: string
}

export interface UpdateRolePayload {
  display_name: string
  description?: string
}

export interface RoleFilter {
  search?: string
  is_active?: boolean
  [key: string]: unknown
}

// Untuk halaman RoleAccessPage
export interface RoleMenuAccessItem {
  menu_id: number
  key_name: string
  label: string
  parent_id: number | null
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
}

export interface SetRoleAccessPayload {
  accesses: {
    menu_id: number
    can_view: boolean
    can_create: boolean
    can_edit: boolean
    can_delete: boolean
  }[]
}
