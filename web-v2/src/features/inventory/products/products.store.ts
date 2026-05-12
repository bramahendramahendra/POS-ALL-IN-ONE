import { create } from 'zustand'

interface DeleteTarget {
  type: 'product' | 'category' | 'unit'
  id: number
}

interface ProductsState {
  activeTab: 'products' | 'categories' | 'units'
  editingProductId: number | null
  editingCategoryId: number | null
  editingUnitId: number | null

  productModalOpen: boolean
  categoryModalOpen: boolean
  unitModalOpen: boolean
  deleteConfirmOpen: boolean
  deleteTarget: DeleteTarget | null

  setActiveTab: (tab: ProductsState['activeTab']) => void
  openProductModal: (id?: number) => void
  closeProductModal: () => void
  openCategoryModal: (id?: number) => void
  closeCategoryModal: () => void
  openUnitModal: (id?: number) => void
  closeUnitModal: () => void
  openDeleteConfirm: (target: DeleteTarget) => void
  closeDeleteConfirm: () => void
}

export const useProductsStore = create<ProductsState>((set) => ({
  activeTab: 'products',
  editingProductId: null,
  editingCategoryId: null,
  editingUnitId: null,

  productModalOpen: false,
  categoryModalOpen: false,
  unitModalOpen: false,
  deleteConfirmOpen: false,
  deleteTarget: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  openProductModal: (id) =>
    set({ productModalOpen: true, editingProductId: id ?? null }),
  closeProductModal: () =>
    set({ productModalOpen: false, editingProductId: null }),

  openCategoryModal: (id) =>
    set({ categoryModalOpen: true, editingCategoryId: id ?? null }),
  closeCategoryModal: () =>
    set({ categoryModalOpen: false, editingCategoryId: null }),

  openUnitModal: (id) =>
    set({ unitModalOpen: true, editingUnitId: id ?? null }),
  closeUnitModal: () =>
    set({ unitModalOpen: false, editingUnitId: null }),

  openDeleteConfirm: (target) =>
    set({ deleteConfirmOpen: true, deleteTarget: target }),
  closeDeleteConfirm: () =>
    set({ deleteConfirmOpen: false, deleteTarget: null }),
}))
