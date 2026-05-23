export type ShiftType = 'pagi' | 'siang' | 'malam'

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
  shift?: ShiftType
  notes?: string
  closed_at?: string
  closed_by_name?: string
}

export interface CashDrawerFilter {
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
  [key: string]: unknown
}

export interface CloseCashDrawerBody {
  closing_balance: number
  notes?: string
}

export interface OpenCashDrawerPayload {
  opening_balance: number
  shift?: ShiftType
  notes?: string
}

export interface CurrentCashDrawer {
  id: number
  status: 'open' | 'closed'
  shift?: ShiftType
}

export interface CashDrawerSummary {
  total_opening: number
  total_closing: number
  total_expenses: number
  net: number
  records: CashDrawer[]
}
