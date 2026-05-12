import type { DiscountType, PaymentMethod } from '@/features/sales/cashier'

export type { DiscountType, PaymentMethod }

export interface TransactionItem {
  product_name: string
  unit_name: string
  qty: number
  price: number
  subtotal: number
}

export interface Transaction {
  id: number
  transaction_code: string
  customer_name?: string
  kasir_name: string
  items: TransactionItem[]
  subtotal: number
  discount_type: DiscountType
  discount_amount: number
  tax_amount: number
  grand_total: number
  payment_method: PaymentMethod
  amount_paid: number
  change_amount: number
  status: 'completed' | 'voided'
  notes?: string
  created_at: string
}

export interface TransactionFilter {
  search?: string
  date_from?: string
  date_to?: string
  payment_method?: PaymentMethod | ''
  status?: 'completed' | 'voided' | ''
  page?: number
  page_size?: number
}
