export interface SupplierReturnItem {
  product_name: string
  quantity: number
  unit: string
  price: number
  subtotal: number
}

export interface SupplierReturn {
  id: number
  return_date: string
  purchase_id: number
  invoice_number: string
  supplier_name: string
  total_return: number
  reason: string
  notes?: string
  items: SupplierReturnItem[]
}

export interface SupplierReturnFilter {
  date_from?: string
  date_to?: string
  supplier_id?: number
  page?: number
  page_size?: number
}

export interface CreateSupplierReturnPayload {
  purchase_id: number
  items: { item_id: number; quantity: number }[]
  reason: string
  notes?: string
}
