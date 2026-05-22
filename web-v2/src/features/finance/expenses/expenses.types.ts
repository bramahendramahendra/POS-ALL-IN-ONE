export type ExpenseCategory = 'operasional' | 'pembelian' | 'gaji' | 'lainnya'

export interface Expense {
  id: number
  expense_date: string
  category: ExpenseCategory
  description: string
  amount: number
  notes?: string
  created_by_name: string
  created_at: string
}

export interface ExpenseFilter {
  date_from?: string
  date_to?: string
  category?: ExpenseCategory
  page?: number
  page_size?: number
}

export interface ExpenseFormData {
  expense_date: string
  category: ExpenseCategory
  description: string
  amount: number
  notes?: string
}
