export type PaymentStatus = 'lunas' | 'hutang' | 'partial'

export interface SupplierPurchaseItem {
  product_id: number
  product_name: string
  quantity: number
  unit: string
  price: number
  subtotal: number
}

export interface SupplierPurchase {
  id: number
  purchase_date: string
  invoice_number: string
  supplier_id: number
  supplier_name: string
  subtotal: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  remaining_amount: number
  payment_status: PaymentStatus
  notes?: string
  items: SupplierPurchaseItem[]
}

export interface SupplierPurchaseFilter {
  date_from?: string
  date_to?: string
  supplier_id?: number
  status?: PaymentStatus
  page?: number
  page_size?: number
}

export interface SupplierPurchasePayment {
  amount: number
  notes?: string
}

export interface CreatePurchaseItemPayload {
  product_id: number
  quantity: number
  price: number
  unit: string
}

export interface CreateSupplierPurchasePayload {
  purchase_date: string
  invoice_number: string
  supplier_id: number
  items: CreatePurchaseItemPayload[]
  discount_amount: number
  notes?: string
  payment_status: PaymentStatus
  paid_amount: number
}
