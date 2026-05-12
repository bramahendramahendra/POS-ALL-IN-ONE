import { useAuth } from '@/features/auth/hooks/useAuth'
import { ROLES } from '@/shared/constants'
import type { Role } from '@/shared/types'

interface UsePermissionReturn {
  isOwner: boolean
  isAdmin: boolean
  isKasir: boolean
  hasRole: (roles: Role[]) => boolean
  canEdit: boolean
  canDelete: boolean
}

export function usePermission(): UsePermissionReturn {
  const { user } = useAuth()

  const isOwner = user?.role === ROLES.OWNER
  const isAdmin = user?.role === ROLES.ADMIN
  const isKasir = user?.role === ROLES.KASIR

  const hasRole = (roles: Role[]) => !!user && roles.includes(user.role)
  const canEdit = isOwner || isAdmin
  const canDelete = isOwner

  return { isOwner, isAdmin, isKasir, hasRole, canEdit, canDelete }
}
