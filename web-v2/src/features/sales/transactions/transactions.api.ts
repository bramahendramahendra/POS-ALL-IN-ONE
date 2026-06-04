import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services/api.client'
import { queryKeys } from '@/shared/constants'
import type { PaginatedResponse } from '@/shared/types'

import type { Transaction, TransactionFilter } from './transactions.types'

export function useTransactionListQuery(filter?: TransactionFilter) {
  return useQuery({
    queryKey: queryKeys.transactions.list(filter as Record<string, unknown>),
    queryFn: () => api.get<PaginatedResponse<Transaction>>('/transactions', filter),
  })
}

export function useTransactionDetailQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => api.get<Transaction>(`/transactions/${id}`),
    enabled: id > 0,
  })
}

export function useVoidTransactionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.patch<Transaction>(`/transactions/${id}/void`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all() })
      toast.success('Transaksi berhasil dibatalkan')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
