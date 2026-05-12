import { LoadingSpinner } from '@/shared/components/LoadingSpinner/LoadingSpinner'

export function PageLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner size="lg" label="Memuat..." />
    </div>
  )
}
