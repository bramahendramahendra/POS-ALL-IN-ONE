import { Navigate } from 'react-router-dom'

import { ROUTES } from '@/shared/constants/routes'

export function ReportsPage() {
  return <Navigate to={ROUTES.REPORTS_SALES} replace />
}
