import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services/api.client'
import { queryKeys } from '@/shared/constants'
import type { PaginatedResponse } from '@/shared/types'

import type { ApiResponse } from '@/shared/types'
import type { SyncConflict, SyncFilter, SyncHistoryItem } from './sync.types'

export function useSyncStatusQuery() {
  return useQuery({
    queryKey: queryKeys.sync.status(),
    queryFn: () => api.get<ApiResponse<{ count: number }>>('/sync/conflicts/count'),
    refetchInterval: 30_000,
  })
}

export function useSyncHistoryQuery(filter?: SyncFilter) {
  return useQuery({
    queryKey: queryKeys.sync.history(),
    queryFn: () => api.get<PaginatedResponse<SyncHistoryItem>>('/sync/history', filter),
  })
}

export function useSyncConflictsQuery() {
  return useQuery({
    queryKey: queryKeys.sync.conflicts(),
    queryFn: () => api.get<SyncConflict[]>('/sync/conflicts'),
  })
}

export function useApproveConflictMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post<void>(`/sync/conflicts/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sync.conflicts() })
      qc.invalidateQueries({ queryKey: queryKeys.sync.status() })
      toast.success('Konflik diselesaikan — data server dipakai')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useRejectConflictMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post<void>(`/sync/conflicts/${id}/reject`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sync.conflicts() })
      qc.invalidateQueries({ queryKey: queryKeys.sync.status() })
      toast.success('Konflik diselesaikan — data lokal dipakai')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useTriggerSyncMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<void>('/sync/trigger'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sync.status() })
      qc.invalidateQueries({ queryKey: queryKeys.sync.history() })
      toast.success('Sinkronisasi manual dimulai')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
