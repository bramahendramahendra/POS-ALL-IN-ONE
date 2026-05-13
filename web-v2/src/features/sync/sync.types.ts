export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'
export type ConflictType = 'product' | 'transaction' | 'customer' | 'stock'
export type ConflictResolution = 'pending' | 'approved' | 'rejected'

export interface SyncStatusData {
  status: SyncStatus
  last_sync_at?: string
  pending_count: number
  conflict_count: number
  message?: string
}

export interface SyncHistoryItem {
  id: number
  device_info: string
  status: 'success' | 'partial' | 'error'
  synced_count: number
  error_count: number
  message?: string
  created_at: string
}

export interface SyncConflict {
  id: number
  conflict_type: ConflictType
  entity_id: number
  entity_name: string
  server_data: Record<string, unknown>
  local_data: Record<string, unknown>
  device_info: string
  resolution: ConflictResolution
  created_at: string
  resolved_at?: string
}

export interface SyncFilter {
  page?: number
  page_size?: number
}
