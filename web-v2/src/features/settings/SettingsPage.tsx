import { Navigate } from 'react-router-dom'

import { ROUTES } from '@/shared/constants/routes'

export function SettingsPage() {
  return <Navigate to={ROUTES.SETTINGS_STORE} replace />
}
