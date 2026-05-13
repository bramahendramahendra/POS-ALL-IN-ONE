import { create } from 'zustand'

interface SyncState {
  selectedConflictId: number | null
  conflictDetailOpen: boolean

  openConflictDetail: (id: number) => void
  closeConflictDetail: () => void
}

export const useSyncStore = create<SyncState>((set) => ({
  selectedConflictId: null,
  conflictDetailOpen: false,

  openConflictDetail: (id) => set({ selectedConflictId: id, conflictDetailOpen: true }),
  closeConflictDetail: () => set({ conflictDetailOpen: false, selectedConflictId: null }),
}))
