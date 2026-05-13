import { useEffect } from 'react'

import { config } from '@/shared/constants'
import { ROUTES } from '@/shared/constants/routes'

import { useAuth } from './hooks/useAuth'
import { LoginForm } from './components/LoginForm'

export function LoginPage() {
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = ROUTES.DASHBOARD
    }
  }, [isAuthenticated])

  if (isAuthenticated) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#2c3e50] px-4">
      {/* App name */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-white tracking-wide">{config.appName}</h1>
        <p className="text-white/60 mt-1 text-sm">Masuk ke akun Anda</p>
      </div>

      {/* Login card */}
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
        <LoginForm />
      </div>

      {/* Footer */}
      <p className="mt-6 text-white/40 text-xs text-center">v1.0.0 &middot; {config.appName}</p>
    </div>
  )
}
