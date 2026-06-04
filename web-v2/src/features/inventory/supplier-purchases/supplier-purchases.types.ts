export type PaymentStatus = 'paid' | 'unpaid' | 'partial'

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: 'Lunas',
  unpaid: 'Hutang',
  partial: 'Bayar Sebagian',
}

export interface SupplierPurchaseItem {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit: string
  conversion_qty: number
  purchase_price: number
  subtotal: number
}

export interface PurchasePayment {
  id: number
  payment_date: string
  amount: number
  payment_method: string
  notes: string
  user_name: string
  created_at: string
}

export interface SupplierPurchase {
  id: number
  purchase_code: string
  invoice_number: string
  purchase_date: string
  supplier_id: number
  supplier_name: string
  discount_amount: number
  total_amount: number
  paid_amount: number
  remaining_amount: number
  payment_status: PaymentStatus
  user_name: string
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
  payment_date: string
  payment_method: string
  notes?: string
}

export interface CreatePurchaseItemPayload {
  product_id: number
  quantity: number
  purchase_price: number
  unit: string
  conversion_qty: number
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
  payment_method?: string
}
