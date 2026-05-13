import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services/api.client'
import { queryKeys } from '@/shared/constants'

import type {
  AppVersion,
  AppUser,
  ChangePasswordPayload,
  CreateUserPayload,
  StoreProfile,
  UpdateUserPayload,
} from './settings.types'

export function useStoreProfileQuery() {
  return useQuery({
    queryKey: queryKeys.settings.store(),
    queryFn: () => api.get<StoreProfile>('/settings/store'),
  })
}

export function useUpdateStoreProfileMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: StoreProfile) => api.put<StoreProfile>('/settings/store', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings.store() })
      toast.success('Profil toko berhasil disimpan')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUserListQuery() {
  return useQuery({
    queryKey: queryKeys.settings.users(),
    queryFn: () => api.get<AppUser[]>('/settings/users'),
  })
}

export function useCreateUserMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => api.post<AppUser>('/settings/users', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings.users() })
      toast.success('User berhasil ditambahkan')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateUserMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) =>
      api.put<AppUser>(`/settings/users/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings.users() })
      toast.success('User berhasil diperbarui')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ChangePasswordPayload }) =>
      api.put<void>(`/settings/users/${id}/password`, payload),
    onSuccess: () => toast.success('Password berhasil diubah'),
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteUserMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/settings/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings.users() })
      toast.success('User berhasil dinonaktifkan')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useAppVersionListQuery() {
  return useQuery({
    queryKey: queryKeys.settings.appVersions(),
    queryFn: () => api.get<AppVersion[]>('/settings/app-versions'),
  })
}
