import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface DataTableEmptyProps {
  message?: string
  description?: string
  action?: ReactNode
}

export function DataTableEmpty({
  message = 'Tidak ada data',
  description,
  action,
}: DataTableEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox size={48} className="mb-4 text-gray-300" />
      <p className="text-base font-medium text-gray-500">{message}</p>
      {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
