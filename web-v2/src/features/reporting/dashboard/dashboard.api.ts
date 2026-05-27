import { useQuery } from '@tanstack/react-query'

import { api } from '@/services/api.client'

import type {
  DashboardPeriod,
  DashboardStats,
  SalesTrendItem,
  TopProductItem,
  SummaryExtraResponse,
} from './dashboard.types'

function periodToTrendParam(period: DashboardPeriod): string {
  switch (period) {
    case 'week':  return '7days'
    case 'month': return '30days'
    default:      return '7days'
  }
}

function periodToDateRange(period: DashboardPeriod): { start_date: string; end_date: string } {
  const now = new Date()
  const end = now.toISOString().split('T')[0]
  let start: string
  if (period === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - 6)
    start = d.toISOString().split('T')[0]
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  } else {
    start = end
  }
  return { start_date: start, end_date: end }
}

export function useDashboardStatsQuery(period: DashboardPeriod) {
  const today = new Date().toISOString().split('T')[0]
  return useQuery({
    queryKey: ['dashboard', 'stats', period],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats', { date: today }),
  })
}

export function useSalesTrendQuery(period: DashboardPeriod) {
  return useQuery({
    queryKey: ['dashboard', 'salesTrend', period],
    queryFn: () =>
      api.get<SalesTrendItem[]>('/dashboard/sales-trend', { period: periodToTrendParam(period) }),
  })
}

export function useTopProductsQuery(period: DashboardPeriod) {
  const range = periodToDateRange(period)
  return useQuery({
    queryKey: ['dashboard', 'topProducts', period],
    queryFn: () => api.get<TopProductItem[]>('/dashboard/top-products', { ...range, limit: 10 }),
  })
}

export function useSummaryExtraQuery(period: DashboardPeriod) {
  const paramMap: Record<DashboardPeriod, string> = { today: 'today', week: '7days', month: 'month' }
  return useQuery({
    queryKey: ['dashboard', 'summaryExtra', period],
    queryFn: () =>
      api.get<SummaryExtraResponse>('/dashboard/summary-extra', { period: paramMap[period] }),
  })
}
