import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services'
import { queryKeys } from '@/shared/constants'

import type {
  CreateRolePayload,
  Role,
  RoleFilter,
  RoleMenuAccessItem,
  SetRoleAccessPayload,
  UpdateRolePayload,
} from './roles.types'

export function useRoleListQuery(filter?: RoleFilter) {
  return useQuery({
    queryKey: queryKeys.roles.list(filter),
    queryFn: () => api.get<Role[]>('/roles', filter),
  })
}

export function useRoleDetailQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.roles.detail(id),
    queryFn: () => api.get<Role>(`/roles/${id}`),
    enabled: id > 0,
  })
}

export function useRoleMenuAccessQuery(roleId: number) {
  return useQuery({
    queryKey: queryKeys.roles.menus(roleId),
    queryFn: () => api.get<RoleMenuAccessItem[]>(`/roles/${roleId}/menus`),
    enabled: roleId > 0,
  })
}

export function useCreateRoleMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => api.post<Role>('/roles', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.roles.all() })
      toast.success('Role berhasil ditambahkan')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateRoleMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateRolePayload & { id: number }) =>
      api.put<Role>(`/roles/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.roles.all() })
      toast.success('Role berhasil diperbarui')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteRoleMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.roles.all() })
      toast.success('Role berhasil dihapus')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useToggleRoleStatusMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.patch(`/roles/${id}/toggle-status`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.roles.all() })
      toast.success('Status role berhasil diubah')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useSetRoleAccessMutation(roleId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SetRoleAccessPayload) =>
      api.put(`/roles/${roleId}/menus`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.roles.menus(roleId) })
      toast.success('Akses menu role berhasil disimpan')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
