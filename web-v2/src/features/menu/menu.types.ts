export interface MenuPermission {
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
}

export interface MenuItem {
  key_name: string
  label: string
  icon: string | null
  path: string | null
  order_index: number
  permission: MenuPermission
  children: MenuItem[]
}

// MenuResponse digunakan di halaman admin manajemen menu (flat list)
export interface MenuResponse {
  id: number
  parent_id: number | null
  key_name: string
  label: string
  icon: string | null
  path: string | null
  order_index: number
  is_active: boolean
  created_at: string
}

export interface CreateMenuPayload {
  parent_id?: number | null
  key_name: string
  label: string
  icon?: string
  path?: string
  order_index?: number
}

export interface UpdateMenuPayload {
  parent_id?: number | null
  label: string
  icon?: string
  path?: string
  order_index?: number
}

export interface ReorderMenuPayload {
  items: { id: number; order_index: number }[]
}

export interface MenuFilter {
  search?: string
  is_active?: boolean
  [key: string]: unknown
}
