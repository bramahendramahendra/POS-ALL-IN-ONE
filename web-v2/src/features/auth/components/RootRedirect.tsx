import { Navigate } from 'react-router-dom'

import { ROLES, ROUTES } from '@/shared/constants'
import { useAuthStore } from '../auth.store'

export function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (user?.roleName === ROLES.KASIR) {
    return <Navigate to={ROUTES.KASIR} replace />
  }

  return <Navigate to={ROUTES.DASHBOARD} replace />
}
