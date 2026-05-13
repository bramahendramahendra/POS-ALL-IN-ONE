import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services/api.client'
import { queryKeys } from '@/shared/constants'
import type { PaginatedResponse } from '@/shared/types'

import type { CloseShiftPayload, OpenShiftPayload, Shift, ShiftFilter } from './shifts.types'

export function useShiftListQuery(filter?: ShiftFilter) {
  return useQuery({
    queryKey: queryKeys.shifts.list(filter as Record<string, unknown>),
    queryFn: () => api.get<PaginatedResponse<Shift>>('/shifts', filter),
  })
}

export function useActiveShiftQuery() {
  return useQuery({
    queryKey: queryKeys.shifts.active(),
    queryFn: () => api.get<Shift | null>('/shifts/active'),
  })
}

export function useShiftDetailQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.shifts.detail(id),
    queryFn: () => api.get<Shift>(`/shifts/${id}`),
    enabled: id > 0,
  })
}

export function useOpenShiftMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: OpenShiftPayload) => api.post<Shift>('/shifts/open', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.shifts.all() })
      qc.invalidateQueries({ queryKey: queryKeys.shifts.active() })
      toast.success('Shift berhasil dibuka')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCloseShiftMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CloseShiftPayload }) =>
      api.post<Shift>(`/shifts/${id}/close`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.shifts.all() })
      qc.invalidateQueries({ queryKey: queryKeys.shifts.active() })
      toast.success('Shift berhasil ditutup')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
