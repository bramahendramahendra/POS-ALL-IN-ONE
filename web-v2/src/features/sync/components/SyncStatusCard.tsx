import { RefreshCw } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'

import { useTriggerSyncMutation } from '../sync.api'
import { useSyncStatus } from '../hooks/useSyncStatus'

function formatDateTime(str?: string): string {
  if (!str) return '—'
  return new Date(str).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SyncStatusCard() {
  const { status, isSyncing, pendingCount, conflictCount } = useSyncStatus()
  const { mutate: triggerSync, isPending } = useTriggerSyncMutation()

  const statusConfig = {
    idle: {
      icon: conflictCount > 0 ? '⚠️' : '🔵',
      text: conflictCount > 0 ? 'Ada Konflik' : 'Siap',
      color: conflictCount > 0 ? 'text-orange-600' : 'text-gray-600',
      bg: conflictCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50',
    },
    syncing: {
      icon: '🔄',
      text: 'Sedang Sinkronisasi...',
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200',
    },
    success: {
      icon: '✅',
      text: 'Tersinkronisasi',
      color: 'text-green-600',
      bg: 'bg-green-50 border-green-200',
    },
    error: {
      icon: '❌',
      text: 'Gagal Sinkronisasi',
      color: 'text-red-600',
      bg: 'bg-red-50 border-red-200',
    },
  }

  const current = statusConfig[status?.status ?? 'idle']

  return (
    <div className={`rounded-xl border p-4 ${current.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700">Status Sinkronisasi</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => triggerSync()}
          disabled={isSyncing || isPending}
          className="gap-1.5"
        >
          <RefreshCw size={14} className={isSyncing || isPending ? 'animate-spin' : ''} />
          Sync Manual
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{current.icon}</span>
        <span className={`font-semibold ${current.color}`}>{current.text}</span>
      </div>

      {status?.message && <p className="text-xs text-gray-500 mb-2">{status.message}</p>}

      <div className="flex gap-6 text-sm text-gray-600">
        <span>
          Terakhir sync: <span className="font-medium">{formatDateTime(status?.last_sync_at)}</span>
        </span>
        <span>
          Pending: <span className="font-medium">{pendingCount} data</span>
        </span>
        <span>
          Konflik:{' '}
          <span className={`font-medium ${conflictCount > 0 ? 'text-orange-600' : ''}`}>
            {conflictCount} item
          </span>
        </span>
      </div>
    </div>
  )
}
