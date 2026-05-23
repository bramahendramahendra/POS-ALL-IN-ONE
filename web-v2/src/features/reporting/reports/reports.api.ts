import { useQuery } from '@tanstack/react-query'

import { api } from '@/services/api.client'
import type { ApiResponse } from '@/shared/types'

import type {
  CashierPerformance,
  ProfitLossReport,
  SalesReport,
  SalesReportFilter,
  SalesReportSummary,
  StockReport,
  StockReportFilter,
} from './reports.types'

interface SalesReportResponse {
  items: SalesReport[]
  total: number
  summary: SalesReportSummary
}

interface StockReportResponse {
  items: StockReport[]
  total: number
  total_stock_value: number
}

export function useSalesReportQuery(filter?: SalesReportFilter) {
  return useQuery({
    queryKey: ['reports', 'sales', filter],
    queryFn: () => api.get<ApiResponse<SalesReportResponse>>('/reports/sales', filter),
  })
}

export function useProfitLossReportQuery(filter: { date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: ['reports', 'profitLoss', filter],
    queryFn: () => api.get<ApiResponse<ProfitLossReport>>('/reports/profit-loss', filter),
  })
}

export function useStockReportQuery(filter?: StockReportFilter) {
  return useQuery({
    queryKey: ['reports', 'stock', filter],
    queryFn: () => api.get<ApiResponse<StockReportResponse>>('/reports/stock', filter),
  })
}

export function useCashierPerformanceQuery(filter: { date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: ['reports', 'cashierPerformance', filter],
    queryFn: () => api.get<ApiResponse<CashierPerformance[]>>('/reports/cashier-performance', filter),
  })
}
