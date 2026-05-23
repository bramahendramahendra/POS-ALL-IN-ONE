import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services/api.client'
import { queryKeys } from '@/shared/constants'
import type { PaginatedResponse } from '@/shared/types'

import type { CashDrawer, CashDrawerFilter, CloseCashDrawerBody, CurrentCashDrawer } from './cash-drawer.types'

export function useCashDrawerCurrentQuery() {
  return useQuery({
    queryKey: ['cashDrawer', 'current'],
    queryFn: () => api.get<CurrentCashDrawer | null>('/cash-drawer/current'),
  })
}

export function useCashDrawerListQuery(filter?: CashDrawerFilter) {
  return useQuery({
    queryKey: ['cashDrawer', 'list', filter],
    queryFn: () => api.get<PaginatedResponse<CashDrawer>>('/cash-drawer', filter),
  })
}

export function useCashDrawerDetailQuery(id: number | null) {
  return useQuery({
    queryKey: ['cashDrawer', 'detail', id],
    queryFn: () => api.get<CashDrawer>(`/cash-drawer/${id}`),
    enabled: id !== null,
  })
}

export function useCloseCashDrawerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CloseCashDrawerBody) => api.post<CashDrawer>('/cash-drawer/close', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashDrawer'] })
      toast.success('Kas harian berhasil ditutup')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
