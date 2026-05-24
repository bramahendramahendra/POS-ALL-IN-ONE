import { Navigate, Outlet } from 'react-router-dom'

import { ErrorBoundary } from '@/shared/components'
import { AppLayout } from '@/shared/components/layouts'
import { ROUTES } from '@/shared/constants/routes'
import type { Role } from '@/shared/types'
import { useAuthStore } from '../auth.store'

interface ProtectedRouteProps {
  allowedRoles: Role[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (user.apps !== 'web') {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (!allowedRoles.includes(user.roleName)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return (
    <AppLayout>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </AppLayout>
  )
}
