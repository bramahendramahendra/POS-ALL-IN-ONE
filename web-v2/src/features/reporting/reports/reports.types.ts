export type ReportType   = 'sales' | 'products' | 'cashiers'
export type GroupBy      = 'day' | 'week' | 'month'
export type ExportFormat = 'csv' | 'excel'

export interface ReportFilter {
  type:       ReportType
  date_from:  string
  date_to:    string
  group_by?:  GroupBy
  page?:      number
  page_size?: number
}

export interface SalesReportRow {
  period:             string
  total_transactions: number
  total_revenue:      number
  total_discount:     number
  total_tax:          number
  net_revenue:        number
}

export interface ProductReportRow {
  product_name: string
  unit_name:    string
  qty_sold:     number
  revenue:      number
  avg_price:    number
}

export interface CashierReportRow {
  kasir_name:         string
  total_transactions: number
  total_revenue:      number
}
