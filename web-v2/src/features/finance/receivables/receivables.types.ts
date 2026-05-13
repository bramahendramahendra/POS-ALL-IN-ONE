export type ReceivableStatus = 'unpaid' | 'partial' | 'paid'

export interface ReceivablePayment {
  id: number
  amount: number
  payment_date: string
  notes?: string
}

export interface Receivable {
  id: number
  transaction_id: number
  transaction_code: string
  customer_id: number
  customer_name: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  status: ReceivableStatus
  due_date?: string
  payments: ReceivablePayment[]
  created_at: string
}

export interface ReceivableFilter {
  search?: string
  status?: ReceivableStatus | ''
  page?: number
  page_size?: number
}

export interface CreatePaymentPayload {
  amount: number
  payment_date: string
  notes?: string
}
