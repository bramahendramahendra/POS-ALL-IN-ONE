import { create } from 'zustand'

interface DeleteTarget {
  type: 'product' | 'category' | 'unit'
  id: number
  name: string
}

interface ProductsState {
  editingProductId: number | null
  editingUnitId: number | null
  detailProductId: number | null

  productModalOpen: boolean
  unitModalOpen: boolean
  deleteConfirmOpen: boolean
  detailModalOpen: boolean
  deleteTarget: DeleteTarget | null

  openProductModal: (id?: number) => void
  closeProductModal: () => void
  openUnitModal: (id?: number) => void
  closeUnitModal: () => void
  openDeleteConfirm: (target: DeleteTarget) => void
  closeDeleteConfirm: () => void
  openDetailModal: (id: number) => void
  closeDetailModal: () => void
}

export const useProductsStore = create<ProductsState>((set) => ({
  editingProductId: null,
  editingUnitId: null,
  detailProductId: null,

  productModalOpen: false,
  unitModalOpen: false,
  deleteConfirmOpen: false,
  detailModalOpen: false,
  deleteTarget: null,

  openProductModal: (id) => set({ productModalOpen: true, editingProductId: id ?? null }),
  closeProductModal: () => set({ productModalOpen: false, editingProductId: null }),

  openUnitModal: (id) => set({ unitModalOpen: true, editingUnitId: id ?? null }),
  closeUnitModal: () => set({ unitModalOpen: false, editingUnitId: null }),

  openDeleteConfirm: (target) => set({ deleteConfirmOpen: true, deleteTarget: target }),
  closeDeleteConfirm: () => set({ deleteConfirmOpen: false, deleteTarget: null }),

  openDetailModal: (id) => set({ detailModalOpen: true, detailProductId: id }),
  closeDetailModal: () => set({ detailModalOpen: false, detailProductId: null }),
}))
