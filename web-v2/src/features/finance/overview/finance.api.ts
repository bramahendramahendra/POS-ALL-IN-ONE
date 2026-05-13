import { useQuery } from '@tanstack/react-query'

import { api } from '@/services/api.client'
import { queryKeys } from '@/shared/constants'
import type { PaginatedResponse } from '@/shared/types'

import type { CashflowItem, FinanceFilter, FinanceSummary } from './finance.types'

export function useFinanceSummaryQuery(filter?: FinanceFilter) {
  return useQuery({
    queryKey: queryKeys.finance.summary(filter as Record<string, unknown>),
    queryFn: () => api.get<FinanceSummary>('/finance/summary', filter),
  })
}

export function useCashflowQuery(filter?: FinanceFilter) {
  return useQuery({
    queryKey: queryKeys.finance.cashflow(filter as Record<string, unknown>),
    queryFn: () => api.get<PaginatedResponse<CashflowItem>>('/finance/cashflow', filter),
  })
}
