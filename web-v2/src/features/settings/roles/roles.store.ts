import { create } from 'zustand'

interface RolesState {
  editingRoleId: number | null
  roleModalOpen: boolean
  deleteConfirmOpen: boolean
  deleteTarget: { id: number; name: string } | null

  openRoleModal: (id?: number) => void
  closeRoleModal: () => void
  openDeleteConfirm: (target: { id: number; name: string }) => void
  closeDeleteConfirm: () => void
}

export const useRolesStore = create<RolesState>((set) => ({
  editingRoleId: null,
  roleModalOpen: false,
  deleteConfirmOpen: false,
  deleteTarget: null,

  openRoleModal: (id) => set({ roleModalOpen: true, editingRoleId: id ?? null }),
  closeRoleModal: () => set({ roleModalOpen: false, editingRoleId: null }),
  openDeleteConfirm: (target) => set({ deleteConfirmOpen: true, deleteTarget: target }),
  closeDeleteConfirm: () => set({ deleteConfirmOpen: false, deleteTarget: null }),
}))
