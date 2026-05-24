export interface SelectOption {
  label: string
  value: string | number
}

export interface DateRangeFilter {
  start_date: string
  end_date: string
}

export type SortOrder = 'asc' | 'desc'

export type Platform = 'web' | 'desktop' | 'android'

// Role adalah nama role sebagai string — tidak lagi hardcoded enum
// karena role bisa ditambah secara dinamis dari UI admin.
// Gunakan ROLES constant untuk nilai bawaan (owner/admin/kasir).
export type Role = string
