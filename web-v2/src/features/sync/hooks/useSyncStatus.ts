import { useEffect } from 'react'
import { toast } from 'sonner'

import { useSyncStatusQuery } from '../sync.api'

const CONFLICT_TOAST_KEY = 'sync_conflict_notified_count'

export function useSyncStatus() {
  const { data: status } = useSyncStatusQuery()

  useEffect(() => {
    const conflictCount = status?.conflict_count ?? 0
    if (conflictCount > 0) {
      const notified = Number(localStorage.getItem(CONFLICT_TOAST_KEY) ?? '0')
      if (conflictCount > notified) {
        toast.warning(`Ada ${conflictCount} konflik sinkronisasi yang perlu diselesaikan`, {
          id: 'sync-conflict-warning',
        })
        localStorage.setItem(CONFLICT_TOAST_KEY, String(conflictCount))
      }
    }
  }, [status?.conflict_count])

  return {
    status,
    hasConflicts: (status?.conflict_count ?? 0) > 0,
    isSyncing: status?.status === 'syncing',
    pendingCount: status?.pending_count ?? 0,
    conflictCount: status?.conflict_count ?? 0,
  }
}
