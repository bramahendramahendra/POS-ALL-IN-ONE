export type ShiftStatus = 'open' | 'closed'

export interface Shift {
  id: number
  kasir_id: number
  kasir_name: string
  opening_balance: number
  closing_balance?: number
  total_transactions: number
  total_revenue: number
  status: ShiftStatus
  notes?: string
  opened_at: string
  closed_at?: string
}

export interface ShiftFilter {
  date_from?: string
  date_to?: string
  status?: ShiftStatus | ''
  page?: number
  page_size?: number
}

export interface OpenShiftPayload {
  opening_balance: number
  notes?: string
}

export interface CloseShiftPayload {
  closing_balance: number
  notes?: string
}
