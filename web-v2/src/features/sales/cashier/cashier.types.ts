export type DiscountType = 'none' | 'percent' | 'amount'
export type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'card'

export interface CartItem {
  product_id: number
  product_name: string
  unit_id: number
  unit_name: string
  barcode?: string
  qty: number
  price: number
  subtotal: number
  notes?: string
}

export interface Discount {
  type: DiscountType
  value: number
  amount: number
}

export interface Tax {
  percent: number
  amount: number
}

export interface CartSummary {
  subtotal: number
  discountAmount: number
  taxAmount: number
  grandTotal: number
}

export interface PaymentPayload {
  customer_id?: number
  items: Array<{
    product_id: number
    unit_id: number
    qty: number
    price: number
    subtotal: number
    notes?: string
  }>
  subtotal: number
  discount_type: DiscountType
  discount_value: number
  discount_amount: number
  tax_percent: number
  tax_amount: number
  grand_total: number
  payment_method: PaymentMethod
  amount_paid: number
  change_amount: number
  notes?: string
}

export interface CheckoutResponse {
  transaction_id: number
  transaction_code: string
  grand_total: number
  amount_paid: number
  change_amount: number
  created_at: string
}
