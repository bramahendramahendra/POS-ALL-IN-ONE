import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services/api.client'
import { queryKeys } from '@/shared/constants'

import type {
  CreateSupplierPayload,
  Supplier,
  SupplierDetail,
  SupplierFilter,
  UpdateSupplierPayload,
} from './suppliers.types'

export interface SupplierListData {
  items: Supplier[]
  total: number
  page: number
  limit: number
}

export function useSupplierListQuery(filter?: SupplierFilter) {
  return useQuery({
    queryKey: queryKeys.suppliers.list(filter as Record<string, unknown>),
    queryFn: () => {
      const { page_size, ...rest } = filter ?? {}
      return api.get<SupplierListData>('/suppliers', { ...rest, limit: page_size })
    },
  })
}

export function useToggleSupplierStatusMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.patch<void>(`/suppliers/${id}/toggle-status`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.suppliers.all() })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useSupplierDetailQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.suppliers.detail(id),
    queryFn: () => api.get<SupplierDetail>(`/suppliers/${id}`),
    enabled: id > 0,
  })
}

export function useCreateSupplierMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSupplierPayload) => api.post<Supplier>('/suppliers', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.suppliers.all() })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateSupplierMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateSupplierPayload & { id: number }) =>
      api.put<Supplier>(`/suppliers/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.suppliers.all() })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteSupplierMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/suppliers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.suppliers.all() })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
