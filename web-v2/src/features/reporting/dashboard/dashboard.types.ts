export type DashboardPeriod = 'today' | 'week' | 'month'

export interface DashboardSummary {
  total_transactions: number
  total_revenue:      number
  total_items_sold:   number
  new_customers:      number
  avg_transaction:    number
  period_label:       string
}

export interface SalesChartPoint {
  label:        string
  revenue:      number
  transactions: number
}

export interface TopProduct {
  rank:         number
  product_name: string
  unit_name:    string
  qty_sold:     number
  revenue:      number
}

export interface DashboardFilter {
  period: DashboardPeriod
}
