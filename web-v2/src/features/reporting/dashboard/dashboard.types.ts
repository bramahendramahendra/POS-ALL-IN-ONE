export type DashboardPeriod = 'today' | 'week' | 'month'

export interface TodayStats {
  total_transactions: number
  total_sales: number
  total_discount: number
  total_expenses: number
  gross_profit: number
}

export interface MonthStats {
  total_transactions: number
  total_sales: number
  total_expenses: number
  gross_profit: number
}

export interface DashboardStats {
  today: TodayStats
  this_month: MonthStats
  low_stock_count: number
  open_receivables: number
}

export interface SalesTrendItem {
  label: string
  total_sales: number
  total_transactions: number
}

export interface TopProductItem {
  product_id: number
  product_name: string
  total_qty: number
  total_value: number
}

export interface SummaryExtraResponse {
  highest: { total_amount: number; transaction_code: string } | null
  peakHour: { hour: number; count: number } | null
  avg: { avg_amount: number; total_count: number } | null
}
