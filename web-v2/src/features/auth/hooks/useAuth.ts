import { ROLES } from '@/shared/constants'
import type { Role } from '@/shared/types'

import { useAuthStore } from '../auth.store'

export const useAuth = () => {
  const { user, isAuthenticated, accessToken, setSession, clearSession } = useAuthStore()

  return {
    user,
    isAuthenticated,
    accessToken,
    isOwner: user?.roleName === ROLES.OWNER,
    isAdmin: user?.roleName === ROLES.ADMIN,
    isKasir: user?.roleName === ROLES.KASIR,
    hasRole: (roles: Role[]) => !!user && roles.includes(user.roleName),
    setSession,
    clearSession,
  }
}
