import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services/api.client'
import { queryKeys } from '@/shared/constants'
import type { PaginatedResponse } from '@/shared/types'

import type { CreatePaymentPayload, Receivable, ReceivableFilter } from './receivables.types'

export function useReceivableListQuery(filter?: ReceivableFilter) {
  return useQuery({
    queryKey: queryKeys.receivables.list(filter as Record<string, unknown>),
    queryFn: () => api.get<PaginatedResponse<Receivable>>('/receivables', filter),
  })
}

export function useReceivableDetailQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.receivables.detail(id),
    queryFn: () => api.get<Receivable>(`/receivables/${id}`),
    enabled: id > 0,
  })
}

export function useAddPaymentMutation(receivableId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) =>
      api.post<Receivable>(`/receivables/${receivableId}/payments`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.receivables.all() })
      qc.invalidateQueries({ queryKey: queryKeys.receivables.detail(receivableId) })
      toast.success('Pembayaran berhasil dicatat')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
