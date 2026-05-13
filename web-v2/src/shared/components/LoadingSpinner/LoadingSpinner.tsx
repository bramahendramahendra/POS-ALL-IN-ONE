import { Loader2 } from 'lucide-react'

import { cn } from '@/shared/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const SIZE_MAP = {
  sm: 16,
  md: 24,
  lg: 40,
}

export function LoadingSpinner({ size = 'md', label }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2', label ? 'gap-2' : '')}>
      <Loader2 size={SIZE_MAP[size]} className="animate-spin text-gray-400" />
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  )
}
