export interface CashDrawer {
  id: number
  date: string
  opening_balance: number
  total_in: number
  total_out: number
  closing_balance: number
  expected_balance: number
  difference: number
  status: 'open' | 'closed'
  notes?: string
  closed_at?: string
  closed_by_name?: string
}

export interface CashDrawerFilter {
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}

export interface CloseCashDrawerBody {
  notes: string
}

export interface CurrentCashDrawer {
  id: number
  status: 'open' | 'closed'
}
