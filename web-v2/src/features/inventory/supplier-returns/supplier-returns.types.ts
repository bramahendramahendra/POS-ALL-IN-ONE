export interface SupplierReturnItem {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit: string
  purchase_price: number
  subtotal: number
}

export interface SupplierReturn {
  id: number
  return_code: string
  return_date: string
  purchase_id: number
  supplier_id?: number
  supplier_name: string
  total_return_amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  user_name: string
  notes?: string
  items?: SupplierReturnItem[]
}

export interface SupplierReturnFilter {
  date_from?: string
  date_to?: string
  supplier_id?: number
  status?: string
  page?: number
  page_size?: number
}

export interface CreateSupplierReturnItemPayload {
  purchase_item_id: number
  product_id: number
  product_name: string
  quantity: number
  unit: string
  purchase_price: number
}

export interface CreateSupplierReturnPayload {
  purchase_id: number
  supplier_id?: number
  supplier_name: string
  return_date: string
  items: CreateSupplierReturnItemPayload[]
  reason: string
  notes?: string
}
