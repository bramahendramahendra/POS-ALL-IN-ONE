# FASE 30 — Sync: Types, Store & API

## Konteks Project
POS System frontend — folder kerja: `web-v2/src/`.
FASE 29 sudah selesai: Settings selesai.
Sync Center adalah fitur yang menangani sinkronisasi data antara offline (desktop/android) dan server.

## Backend Endpoints
```
GET  /sync/status        → status sinkronisasi terkini
GET  /sync/history       → riwayat sync (pagination)
GET  /sync/conflicts     → daftar konflik yang belum resolved
POST /sync/conflicts/:id/approve → approve konflik (pakai data server)
POST /sync/conflicts/:id/reject  → reject konflik (pakai data lokal)
POST /sync/trigger       → trigger sync manual
```

## Konteks Bisnis
- Desktop dan Android app bisa kerja offline
- Saat online, data dari offline di-sync ke server
- Konflik terjadi jika data yang sama diubah di dua tempat
- Web app hanya melihat status sync dan resolve konflik (bukan yang melakukan sync)

## Tugas Fase Ini

### File 1: `src/features/sync/sync.types.ts`
```ts
export type SyncStatus   = 'idle' | 'syncing' | 'success' | 'error'
export type ConflictType = 'product' | 'transaction' | 'customer' | 'stock'
export type ConflictResolution = 'pending' | 'approved' | 'rejected'

export interface SyncStatusData {
  status:          SyncStatus
  last_sync_at?:   string
  pending_count:   number
  conflict_count:  number
  message?:        string
}

export interface SyncHistoryItem {
  id:           number
  device_info:  string
  status:       'success' | 'partial' | 'error'
  synced_count: number
  error_count:  number
  message?:     string
  created_at:   string
}

export interface SyncConflict {
  id:             number
  conflict_type:  ConflictType
  entity_id:      number
  entity_name:    string
  server_data:    Record<string, unknown>
  local_data:     Record<string, unknown>
  device_info:    string
  resolution:     ConflictResolution
  created_at:     string
  resolved_at?:   string
}

export interface SyncFilter {
  page?:      number
  page_size?: number
}
```

### File 2: `src/features/sync/sync.api.ts`
**Queries:**
- `useSyncStatusQuery()` → `SyncStatusData`
  - `refetchInterval: 30_000` (polling setiap 30 detik)
  - `queryKey: queryKeys.sync.status()`
- `useSyncHistoryQuery(filter?)` → `PaginatedResponse<SyncHistoryItem>`
- `useSyncConflictsQuery()` → `SyncConflict[]`

**Mutations:**
- `useApproveConflictMutation()` → onSuccess: invalidate conflicts + status
- `useRejectConflictMutation()` → onSuccess: invalidate conflicts + status
- `useTriggerSyncMutation()` → onSuccess: toast + invalidate status + history

### File 3: `src/features/sync/sync.store.ts`
UI state:
```ts
interface SyncState {
  selectedConflictId:   number | null
  conflictDetailOpen:   boolean

  openConflictDetail:   (id: number) => void
  closeConflictDetail:  () => void
}
```

### File 4: `src/features/sync/hooks/useSyncStatus.ts`
Custom hook yang menggabungkan sync status dengan notifikasi:
```ts
export const useSyncStatus = () => {
  const { data: status } = useSyncStatusQuery()

  // Tampil toast warning jika ada konflik baru
  useEffect(() => {
    if (status?.conflict_count > 0) {
      // Hanya tampil sekali, gunakan localStorage untuk track
    }
  }, [status?.conflict_count])

  return {
    status,
    hasConflicts:  (status?.conflict_count ?? 0) > 0,
    isSyncing:     status?.status === 'syncing',
    pendingCount:  status?.pending_count ?? 0,
    conflictCount: status?.conflict_count ?? 0,
  }
}
```

### File 5: `src/features/sync/index.ts`
```ts
export { SyncCenterPage }  from './SyncCenterPage'   // akan dibuat di FASE 31
export { useSyncStatus }   from './hooks/useSyncStatus'
export type { SyncStatusData, SyncConflict } from './sync.types'
```

## Hasil yang Diharapkan
- Types dan store siap dipakai
- `useSyncStatusQuery` melakukan polling setiap 30 detik
- `useSyncStatus` hook siap dipakai di navbar (badge notifikasi)
- TypeScript tidak ada error
