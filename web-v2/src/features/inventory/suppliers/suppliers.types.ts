export interface Supplier {
  id: number
  name: string
  contact_name?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  created_at: string
}

export interface SupplierFilter {
  search?: string
  page?: number
  page_size?: number
}

export interface CreateSupplierPayload {
  name: string
  contact_name?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>
