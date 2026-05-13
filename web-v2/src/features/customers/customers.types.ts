export interface Customer {
  id: number
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  created_at: string
}

export interface CustomerFilter {
  search?: string
  page?: number
  page_size?: number
}

export interface CreateCustomerPayload {
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>
