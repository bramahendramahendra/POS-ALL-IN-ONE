import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services'
import { queryKeys } from '@/shared/constants'
import { ROUTES } from '@/shared/constants/routes'
import { ROLES } from '@/shared/constants/roles'

import { useAuthStore } from './auth.store'
import type { AuthUser, LoginRequest, LoginResponse } from './auth.types'

export function useLoginMutation() {
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (payload: LoginRequest) => api.post<LoginResponse>('/auth/login', payload),

    onSuccess: (data) => {
      const user: AuthUser = {
        id: data.user.id,
        username: data.user.username,
        fullName: data.user.full_name,
        role: data.user.role,
        apps: 'web',
      }

      setSession({
        accessToken: data.token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
        user,
      })

      const destination = data.user.role === ROLES.KASIR ? ROUTES.KASIR : ROUTES.DASHBOARD
      window.location.href = destination
    },

    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useLogoutMutation() {
  const clearSession = useAuthStore((s) => s.clearSession)

  return useMutation({
    mutationFn: () => api.post<void>('/auth/logout'),

    onSuccess: () => {
      clearSession()
      toast.success('Logout berhasil')
      window.location.href = ROUTES.LOGIN
    },

    onError: () => {
      clearSession()
      window.location.href = ROUTES.LOGIN
    },
  })
}

export function useGetMeQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: () => api.get<AuthUser>('/auth/me'),
    enabled: isAuthenticated,
  })
}
