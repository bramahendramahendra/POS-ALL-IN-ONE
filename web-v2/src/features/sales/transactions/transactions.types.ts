import type { DiscountType, PaymentMethod } from '@/features/sales/cashier'

export type { DiscountType, PaymentMethod }

export interface TransactionItem {
  id: number
  product_id: number
  product_name: string
  unit: string
  conversion_qty: number
  quantity: number
  price: number
  subtotal: number
  discount_item: number
}

export interface Transaction {
  id: number
  transaction_code: string
  user_id: number
  kasir_name: string
  customer_id?: number
  customer_name?: string
  shift_id?: number
  transaction_date: string
  items: TransactionItem[]
  subtotal: number
  discount: number
  tax: number
  total_amount: number
  payment_method: PaymentMethod
  payment_amount: number
  change_amount: number
  is_credit: boolean
  status: 'completed' | 'void'
  device_source: string
}

export interface TransactionFilter {
  search?: string
  start_date?: string
  end_date?: string
  payment_method?: PaymentMethod | ''
  status?: 'completed' | 'void' | ''
  page?: number
  limit?: number
}
