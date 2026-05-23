import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services/api.client'
import { queryKeys } from '@/shared/constants'
import type { ApiResponse } from '@/shared/types'

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

// ─── Printer ──────────────────────────────────────────────────────────────────

export interface PrinterSettings {
  paper_size: '58mm' | '80mm'
  receipt_header: string
  receipt_footer: string
  show_logo: boolean
  auto_print: boolean
}

const PRINTER_QK = ['settings', 'printer'] as const

export function usePrinterSettingsQuery() {
  return useQuery({
    queryKey: PRINTER_QK,
    queryFn: () => api.get<ApiResponse<PrinterSettings>>('/settings/printer'),
  })
}

export function useUpdatePrinterSettingsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PrinterSettings) => api.put<PrinterSettings>('/settings/printer', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRINTER_QK })
      toast.success('Pengaturan printer berhasil disimpan')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
