import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services'
import { queryKeys } from '@/shared/constants'

import type {
  CreateMenuPayload,
  MenuFilter,
  MenuResponse,
  MenuItem,
  ReorderMenuPayload,
  UpdateMenuPayload,
} from './menu.types'

// GET /menus/my — menu tree untuk user yang sedang login
export function useMyMenusQuery() {
  return useQuery({
    queryKey: queryKeys.menus.my(),
    queryFn: () => api.get<MenuItem[]>('/menus/my'),
    staleTime: 10 * 60 * 1000, // 10 menit — menu jarang berubah
  })
}

// GET /menus — daftar semua menu (admin)
export function useMenuListQuery(filter?: MenuFilter) {
  return useQuery({
    queryKey: queryKeys.menus.list(filter),
    queryFn: () => api.get<MenuResponse[]>('/menus', filter),
  })
}

// GET /menus/:id
export function useMenuDetailQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.menus.detail(id),
    queryFn: () => api.get<MenuResponse>(`/menus/${id}`),
    enabled: id > 0,
  })
}

export function useCreateMenuMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMenuPayload) => api.post<MenuResponse>('/menus', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menus.all() })
      toast.success('Menu berhasil ditambahkan')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateMenuMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateMenuPayload & { id: number }) =>
      api.put<MenuResponse>(`/menus/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menus.all() })
      toast.success('Menu berhasil diperbarui')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteMenuMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/menus/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menus.all() })
      toast.success('Menu berhasil dihapus')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useReorderMenuMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReorderMenuPayload) => api.patch('/menus/reorder', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menus.all() })
      toast.success('Urutan menu berhasil diperbarui')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
