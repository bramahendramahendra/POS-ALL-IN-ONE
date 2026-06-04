import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services/api.client'

import type {
  CreateSupplierReturnPayload,
  SupplierReturn,
  SupplierReturnFilter,
} from './supplier-returns.types'

interface SupplierReturnListData {
  items: SupplierReturn[]
  total: number
  page: number
  limit: number
}

interface UpdateStatusPayload {
  status: 'approved' | 'rejected'
  notes?: string
}

const QK = {
  all: () => ['supplierReturns'] as const,
  list: (filter?: SupplierReturnFilter) => ['supplierReturns', 'list', filter] as const,
  detail: (id: number) => ['supplierReturns', 'detail', id] as const,
}

export function useSupplierReturnsQuery(filter?: SupplierReturnFilter) {
  return useQuery({
    queryKey: QK.list(filter),
    queryFn: () => {
      const { page_size, ...rest } = filter ?? {}
      return api.get<SupplierReturnListData>('/supplier-returns', { ...rest, limit: page_size })
    },
  })
}

export function useSupplierReturnDetailQuery(id: number | null) {
  return useQuery({
    queryKey: QK.detail(id ?? 0),
    queryFn: () => api.get<SupplierReturn>(`/supplier-returns/${id}`),
    enabled: id !== null && id > 0,
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

export function useUpdateSupplierReturnStatusMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateStatusPayload }) =>
      api.patch<SupplierReturn>(`/supplier-returns/${id}/status`, payload),
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
