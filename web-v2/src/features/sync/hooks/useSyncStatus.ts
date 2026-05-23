import { useEffect } from 'react'
import { toast } from 'sonner'

import { useSyncStatusQuery } from '../sync.api'

const CONFLICT_TOAST_KEY = 'sync_conflict_notified_count'

export function useSyncStatus() {
  const { data } = useSyncStatusQuery()
  const conflictCount = data?.data?.count ?? 0

  useEffect(() => {
    if (conflictCount > 0) {
      const notified = Number(localStorage.getItem(CONFLICT_TOAST_KEY) ?? '0')
      if (conflictCount > notified) {
        toast.warning(`Ada ${conflictCount} konflik sinkronisasi yang perlu diselesaikan`, {
          id: 'sync-conflict-warning',
        })
        localStorage.setItem(CONFLICT_TOAST_KEY, String(conflictCount))
      }
    }
  }, [conflictCount])

  return {
    status: null,
    hasConflicts: conflictCount > 0,
    isSyncing: false,
    pendingCount: 0,
    conflictCount,
  }
}
