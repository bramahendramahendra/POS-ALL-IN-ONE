import { cn } from '@/shared/utils'

type StatusType =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'processing'
  | 'paid'
  | 'unpaid'
  | 'partial'
  | 'open'
  | 'closed'
  | 'synced'
  | 'unsynced'
  | 'conflict'
  | 'success'
  | 'error'
  | 'warning'

interface StatusBadgeProps {
  status: StatusType
  label?: string
  size?: 'sm' | 'md'
}

const STATUS_MAP: Record<StatusType, { label: string; className: string }> = {
  active: { label: 'Aktif', className: 'bg-green-100 text-green-700 border-green-200' },
  inactive: { label: 'Nonaktif', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  processing: { label: 'Diproses', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  paid: { label: 'Lunas', className: 'bg-green-100 text-green-700 border-green-200' },
  unpaid: { label: 'Belum Lunas', className: 'bg-red-100 text-red-700 border-red-200' },
  partial: { label: 'Sebagian', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  open: { label: 'Buka', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  closed: { label: 'Tutup', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  synced: { label: 'Tersinkron', className: 'bg-green-100 text-green-700 border-green-200' },
  unsynced: { label: 'Belum Sync', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  conflict: { label: 'Konflik', className: 'bg-red-100 text-red-700 border-red-200' },
  success: { label: 'Berhasil', className: 'bg-green-100 text-green-700 border-green-200' },
  error: { label: 'Error', className: 'bg-red-100 text-red-700 border-red-200' },
  warning: { label: 'Peringatan', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
}

export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_MAP[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
        config.className
      )}
    >
      {label ?? config.label}
    </span>
  )
}
