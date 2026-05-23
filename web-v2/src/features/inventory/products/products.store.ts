import { create } from 'zustand'

interface DeleteTarget {
  type: 'product' | 'category' | 'unit'
  id: number
  name: string
}

interface ProductsState {
  editingProductId: number | null
  editingUnitId: number | null

  productModalOpen: boolean
  unitModalOpen: boolean
  deleteConfirmOpen: boolean
  deleteTarget: DeleteTarget | null

  openProductModal: (id?: number) => void
  closeProductModal: () => void
  openUnitModal: (id?: number) => void
  closeUnitModal: () => void
  openDeleteConfirm: (target: DeleteTarget) => void
  closeDeleteConfirm: () => void
}

export const useProductsStore = create<ProductsState>((set) => ({
  editingProductId: null,
  editingUnitId: null,

  productModalOpen: false,
  unitModalOpen: false,
  deleteConfirmOpen: false,
  deleteTarget: null,

  openProductModal: (id) => set({ productModalOpen: true, editingProductId: id ?? null }),
  closeProductModal: () => set({ productModalOpen: false, editingProductId: null }),

  openUnitModal: (id) => set({ unitModalOpen: true, editingUnitId: id ?? null }),
  closeUnitModal: () => set({ unitModalOpen: false, editingUnitId: null }),

  openDeleteConfirm: (target) => set({ deleteConfirmOpen: true, deleteTarget: target }),
  closeDeleteConfirm: () => set({ deleteConfirmOpen: false, deleteTarget: null }),
}))
