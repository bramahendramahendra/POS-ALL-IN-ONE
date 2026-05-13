import { useNavigate } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'
import { config } from '@/shared/constants'
import { ROUTES } from '@/shared/constants/routes'

interface PageErrorProps {
  error?: Error
  onReset?: () => void
}

export function PageError({ error, onReset }: PageErrorProps) {
  const navigate = useNavigate()

  const handleReset = () => {
    if (onReset) {
      onReset()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-800">Terjadi Kesalahan</h2>
        <p className="text-gray-500 text-sm">
          Halaman ini mengalami error yang tidak terduga. Silakan coba muat ulang halaman.
        </p>

        {config.isDev && error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-left mt-4">
            <p className="text-xs font-semibold text-red-700 mb-1">{error.message}</p>
            {error.stack && (
              <pre className="text-xs text-red-600 overflow-auto max-h-32 whitespace-pre-wrap">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center pt-2">
          <Button onClick={handleReset} className="gap-2">
            🔄 Muat Ulang Halaman
          </Button>
          <Button variant="outline" onClick={() => navigate(ROUTES.DASHBOARD)} className="gap-2">
            ← Kembali ke Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
