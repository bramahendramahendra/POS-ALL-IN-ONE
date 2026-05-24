import type { ReactNode } from 'react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Role } from '@/shared/types'

interface RoleGuardProps {
  allowedRoles: Role[]
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth()

  if (!user || !allowedRoles.includes(user.roleName)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
