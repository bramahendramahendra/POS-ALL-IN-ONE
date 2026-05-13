import { useQuery } from '@tanstack/react-query'

import { api } from '@/services/api.client'
import { queryKeys } from '@/shared/constants'

import type {
  DashboardPeriod,
  DashboardSummary,
  SalesChartPoint,
  TopProduct,
} from './dashboard.types'

export function useDashboardSummaryQuery(period: DashboardPeriod) {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(period),
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary', { period }),
  })
}

export function useSalesChartQuery(period: DashboardPeriod) {
  return useQuery({
    queryKey: queryKeys.dashboard.salesChart(period),
    queryFn: () => api.get<SalesChartPoint[]>('/dashboard/sales-chart', { period }),
  })
}

export function useTopProductsQuery(period: DashboardPeriod, limit = 10) {
  return useQuery({
    queryKey: queryKeys.dashboard.topProducts(period),
    queryFn: () => api.get<TopProduct[]>('/dashboard/top-products', { period, limit }),
  })
}
