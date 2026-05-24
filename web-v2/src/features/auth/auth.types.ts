import type { Role, Platform } from '@/shared/types'

export interface AuthUser {
  id: number
  username: string
  fullName: string
  roleId: number
  roleName: Role
  apps: Platform
}

export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: string | null
  user: AuthUser | null
  isAuthenticated: boolean

  setSession: (payload: SetSessionPayload) => void
  clearSession: () => void
}

export interface SetSessionPayload {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: AuthUser
}

export interface LoginRequest {
  username: string
  password: string
  device_info: 'web'
}

export interface LoginResponse {
  token: string
  refresh_token: string
  expires_at: string
  user: {
    id: number
    username: string
    full_name: string
    role_id: number
    role_name: Role
  }
}
