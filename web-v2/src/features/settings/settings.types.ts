import type { Platform, Role } from '@/shared/types'


export interface StoreProfile {
  name: string
  address?: string
  phone?: string
  email?: string
  logo_url?: string
  tax_default?: number
}

export interface AppUser {
  id: number
  username: string
  full_name: string
  role_id: number
  role_name: Role
  is_active: boolean
  created_at: string
}

export interface CreateUserPayload {
  username: string
  password: string
  full_name: string
  role_id: number
}

export interface UpdateUserPayload {
  full_name?: string
  role_id?: number
  is_active?: boolean
}

export interface ChangePasswordPayload {
  new_password: string
}

export interface AppVersion {
  id: number
  platform: Platform
  version: string
  download_url: string
  is_mandatory: boolean
  release_notes?: string
  created_at: string
}
