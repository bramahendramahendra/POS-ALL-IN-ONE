// ─── Legacy (kept for backward compat) ────────────────────────────────────────
export type ReportType = 'sales' | 'products' | 'cashiers'
export type GroupBy = 'day' | 'week' | 'month'
export type ExportFormat = 'csv' | 'excel'

export interface ReportFilter {
  type: ReportType
  date_from: string
  date_to: string
  group_by?: GroupBy
  page?: number
  page_size?: number
}

// ─── Tab 1: Laporan Penjualan ──────────────────────────────────────────────────
export interface SalesReport {
  transaction_code: string
  transaction_date: string
  cashier_name: string
  customer_name?: string
  total_amount: number
  payment_method: string
  status: 'completed' | 'void'
}

export interface SalesReportSummary {
  total_transactions: number
  total_revenue: number
  avg_per_transaction: number
}

export interface SalesReportFilter {
  date_from?: string
  date_to?: string
  user_id?: number
  payment_method?: string
  page?: number
  page_size?: number
}

// ─── Tab 2: Laba Rugi ──────────────────────────────────────────────────────────
export interface ProfitLossReport {
  period_from: string
  period_to: string
  total_sales: number
  total_returns: number
  total_hpp: number
  total_expense: number
  gross_profit: number
  net_profit: number
}

// ─── Tab 3: Laporan Stok ───────────────────────────────────────────────────────
export interface StockReport {
  product_code: string
  product_name: string
  category_name: string
  unit: string
  current_stock: number
  min_stock: number
  cost_price: number
  stock_value: number
}

export interface StockReportFilter {
  category_id?: number
  search?: string
  page?: number
  page_size?: number
}

// ─── Legacy row types used by ReportTable ─────────────────────────────────────
export interface SalesReportRow {
  period: string
  total_transactions: number
  total_revenue: number
  total_discount: number
  total_tax: number
  net_revenue: number
}

export interface ProductReportRow {
  product_name: string
  unit_name: string
  qty_sold: number
  revenue: number
  avg_price: number
}

export interface CashierReportRow {
  kasir_name: string
  total_transactions: number
  total_revenue: number
}

// ─── Tab 4: Kinerja Kasir ──────────────────────────────────────────────────────
export interface CashierPerformance {
  user_id: number
  cashier_name: string
  total_transactions: number
  total_sales: number
  avg_per_transaction: number
  void_count: number
}
