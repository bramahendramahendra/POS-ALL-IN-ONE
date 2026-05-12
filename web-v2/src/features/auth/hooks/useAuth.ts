import { ROLES } from '@/shared/constants'
import type { Role } from '@/shared/types'

import { useAuthStore } from '../auth.store'

export const useAuth = () => {
  const { user, isAuthenticated, accessToken, setSession, clearSession } = useAuthStore()

  return {
    user,
    isAuthenticated,
    accessToken,
    isOwner: user?.role === ROLES.OWNER,
    isAdmin: user?.role === ROLES.ADMIN,
    isKasir: user?.role === ROLES.KASIR,
    hasRole: (roles: Role[]) => !!user && roles.includes(user.role),
    setSession,
    clearSession,
  }
}
