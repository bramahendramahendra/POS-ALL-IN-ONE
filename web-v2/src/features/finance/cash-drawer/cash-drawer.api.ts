import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/services/api.client'
import { queryKeys } from '@/shared/constants'
import type { PaginatedResponse } from '@/shared/types'

import type { CashDrawer, CashDrawerFilter, CloseCashDrawerBody } from './cash-drawer.types'

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
    },
  })
}
