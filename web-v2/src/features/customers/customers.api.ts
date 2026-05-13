import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services/api.client'
import { queryKeys } from '@/shared/constants'
import type { PaginatedResponse } from '@/shared/types'

import type {
  CreateCustomerPayload,
  Customer,
  CustomerFilter,
  UpdateCustomerPayload,
} from './customers.types'

export function useCustomerListQuery(filter?: CustomerFilter) {
  return useQuery({
    queryKey: queryKeys.customers.list(filter as Record<string, unknown>),
    queryFn: () => api.get<PaginatedResponse<Customer>>('/customers', filter),
  })
}

export function useCustomerDetailQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => api.get<Customer>(`/customers/${id}`),
    enabled: id > 0,
  })
}

export function useCreateCustomerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) => api.post<Customer>('/customers', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.customers.all() })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateCustomerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCustomerPayload & { id: number }) =>
      api.put<Customer>(`/customers/${id}`, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.customers.all() })
      qc.invalidateQueries({ queryKey: queryKeys.customers.detail(id) })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteCustomerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/customers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.customers.all() })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
