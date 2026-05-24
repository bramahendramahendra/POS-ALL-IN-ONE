import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services'
import { queryKeys } from '@/shared/constants'
import { ROUTES } from '@/shared/constants/routes'
import { ROLES } from '@/shared/constants/roles'
import { useMenuStore } from '@/features/menu/menu.store'

import { useAuthStore } from './auth.store'
import type { AuthUser, LoginRequest, LoginResponse } from './auth.types'
import type { MenuItem } from '@/features/menu/menu.types'

export function useLoginMutation() {
  const setSession = useAuthStore((s) => s.setSession)
  const setMenus = useMenuStore((s) => s.setMenus)

  return useMutation({
    mutationFn: (payload: LoginRequest) => api.post<LoginResponse>('/auth/login', payload),

    onSuccess: async (data) => {
      const user: AuthUser = {
        id: data.user.id,
        username: data.user.username,
        fullName: data.user.full_name,
        roleId: data.user.role_id,
        roleName: data.user.role_name,
        apps: 'web',
      }

      setSession({
        accessToken: data.token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
        user,
      })

      // Fetch menu akses langsung setelah login
      try {
        const menus = await api.get<MenuItem[]>('/menus/my')
        setMenus(menus)
      } catch {
        // Menu gagal diambil tidak menghentikan login
      }

      const destination = data.user.role_name === ROLES.KASIR ? ROUTES.KASIR : ROUTES.DASHBOARD
      window.location.href = destination
    },

    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useLogoutMutation() {
  const clearSession = useAuthStore((s) => s.clearSession)
  const clearMenus = useMenuStore((s) => s.clearMenus)

  return useMutation({
    mutationFn: () => api.post<void>('/auth/logout'),

    onSuccess: () => {
      clearSession()
      clearMenus()
      toast.success('Logout berhasil')
      window.location.href = ROUTES.LOGIN
    },

    onError: () => {
      clearSession()
      clearMenus()
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
