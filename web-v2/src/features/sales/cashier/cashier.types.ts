export interface ProductSearchResult {
  id: number
  barcode: string
  name: string
  selling_price: number
  stock: number
  unit_id: number
  unit_name: string
}

export type DiscountType = 'none' | 'percent' | 'amount'
export type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'card' | 'kredit'

// Nilai enum yang diterima backend (sesuai validasi oneof)
export const PAYMENT_METHOD_VALUES = ['cash', 'transfer', 'qris', 'card', 'kredit'] as const

export interface CartItem {
  product_id: number
  product_name: string
  unit_id: number      // product_packages.id
  unit_name: string    // snapshot nama satuan untuk struk
  conversion_qty: number
  barcode?: string
  qty: number
  price: number
  subtotal: number
  notes?: string
  // Per-item discount fields
  discount_type?: 'percent' | 'nominal'
  discount_value?: number
  discount_amount?: number   // total potongan dalam rupiah
  effective_price?: number   // harga per unit setelah diskon
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
  shift_id?: number
  is_credit: boolean
  device_source: 'web'
  items: Array<{
    product_id: number
    product_name: string
    unit_id?: number
    unit: string
    conversion_qty: number
    quantity: number
    price: number
    subtotal: number
    discount_item?: number
  }>
  subtotal: number
  discount: number
  tax: number
  total_amount: number
  payment_method: PaymentMethod
  payment_amount: number
  change_amount: number
}

export interface CheckoutResponse {
  id: number
  transaction_code: string
  total_amount: number
  payment_amount: number
  change_amount: number
  transaction_date: string
}
