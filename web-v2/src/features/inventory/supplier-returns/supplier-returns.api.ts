import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services/api.client'
import type { PaginatedResponse } from '@/shared/types'

import type {
  CreateSupplierReturnPayload,
  SupplierReturn,
  SupplierReturnFilter,
} from './supplier-returns.types'

const QK = {
  all: () => ['supplierReturns'] as const,
  list: (filter?: SupplierReturnFilter) => ['supplierReturns', 'list', filter] as const,
}

export function useSupplierReturnsQuery(filter?: SupplierReturnFilter) {
  return useQuery({
    queryKey: QK.list(filter),
    queryFn: () => api.get<PaginatedResponse<SupplierReturn>>('/supplier-returns', filter),
  })
}

export function useCreateSupplierReturnMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSupplierReturnPayload) =>
      api.post<SupplierReturn>('/supplier-returns', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all() })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteSupplierReturnMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/supplier-returns/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all() })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
