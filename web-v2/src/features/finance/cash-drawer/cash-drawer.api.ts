import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services/api.client'
import { queryKeys } from '@/shared/constants'
import type { ApiResponse, PaginatedResponse } from '@/shared/types'

import type {
  CashDrawer,
  CashDrawerFilter,
  CashDrawerSummary,
  CloseCashDrawerBody,
  CurrentCashDrawer,
  OpenCashDrawerPayload,
} from './cash-drawer.types'

export function useCashDrawerCurrentQuery() {
  return useQuery({
    queryKey: queryKeys.cashDrawer.current(),
    queryFn: () => api.get<ApiResponse<CurrentCashDrawer | null>>('/cash-drawer/current'),
  })
}

export function useCashDrawerListQuery(filter?: CashDrawerFilter) {
  return useQuery({
    queryKey: queryKeys.cashDrawer.list(filter),
    queryFn: () => api.get<PaginatedResponse<CashDrawer>>('/cash-drawer', filter),
  })
}

export function useCashDrawerDetailQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.cashDrawer.detail(id ?? 0),
    queryFn: () => api.get<ApiResponse<CashDrawer>>(`/cash-drawer/${id}`),
    enabled: id !== null,
  })
}

export function useOpenCashDrawerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: OpenCashDrawerPayload) => api.post<void>('/cash-drawer/open', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cashDrawer.all() })
      toast.success('Kas berhasil dibuka')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCloseCashDrawerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, closing_balance, notes }: CloseCashDrawerBody & { id: number }) =>
      api.post<void>(`/cash-drawer/${id}/close`, { closing_balance, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cashDrawer.all() })
      toast.success('Kas berhasil ditutup')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCashDrawerSummaryQuery(filter?: { date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: queryKeys.cashDrawer.summary(filter),
    queryFn: () => api.get<ApiResponse<CashDrawerSummary>>('/cash-drawer/summary', filter),
  })
}
