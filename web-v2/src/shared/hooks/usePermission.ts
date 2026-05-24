import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMenuStore } from '@/features/menu/menu.store'
import { ROLES } from '@/shared/constants'
import type { Role } from '@/shared/types'

interface UsePermissionReturn {
  isOwner: boolean
  isAdmin: boolean
  isKasir: boolean
  hasRole: (roles: Role[]) => boolean
  canEdit: boolean
  canDelete: boolean
  hasMenuAccess: (keyName: string) => boolean
}

export function usePermission(): UsePermissionReturn {
  const { user } = useAuth()
  const hasAccess = useMenuStore((s) => s.hasAccess)

  const isOwner = user?.roleName === ROLES.OWNER
  const isAdmin = user?.roleName === ROLES.ADMIN
  const isKasir = user?.roleName === ROLES.KASIR

  const hasRole = (roles: Role[]) => !!user && roles.includes(user.roleName)
  const canEdit = isOwner || isAdmin
  const canDelete = isOwner

  return { isOwner, isAdmin, isKasir, hasRole, canEdit, canDelete, hasMenuAccess: hasAccess }
}
