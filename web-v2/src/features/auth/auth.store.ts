import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { AuthState, SetSessionPayload } from './auth.types'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isAuthenticated: false,

      setSession: (payload: SetSessionPayload) =>
        set({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          expiresAt: payload.expiresAt,
          user: payload.user,
          isAuthenticated: true,
        }),

      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    { name: 'auth-session' }
  )
)
