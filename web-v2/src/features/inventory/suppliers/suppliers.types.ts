export interface Supplier {
  id: number
  supplier_code: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  is_active: boolean
}

export interface SupplierPurchaseItem {
  id: number
  purchase_code: string
  purchase_date: string
  total_amount: number
  payment_status: string
  remaining_amount: number
}

export interface SupplierReturnHistoryItem {
  id: number
  return_code: string
  return_date: string
  total_return: number
  reason: string
  status: string
}

export interface SupplierDetail {
  id: number
  supplier_code: string
  name: string
  contact_person: string
  phone: string
  email: string
  address: string
  notes: string
  is_active: boolean
  total_purchases: number
  total_amount: number
  total_debt: number
  total_return: number
  purchase_history: SupplierPurchaseItem[]
  return_history: SupplierReturnHistoryItem[]
}

export interface SupplierFilter {
  search?: string
  is_active?: boolean
  page?: number
  page_size?: number
}

export interface CreateSupplierPayload {
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>
