import { useState } from 'react'
import { Plus } from 'lucide-react'

import { ROLES } from '@/shared/constants'
import { ConfirmDialog, PageHeader, RoleGuard } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { usePagination } from '@/shared/hooks'

import {
  useCategoryListQuery,
  useDeleteProductMutation,
  useProductListQuery,
} from './products.api'
import { useProductsStore } from './products.store'
import type { ProductFilter } from './products.types'
import { ProductFilterBar } from './components/ProductFilter'
import { ProductFormModal } from './components/ProductFormModal'
import { ProductTable } from './components/ProductTable'

const TABS = [
  { key: 'products', label: 'Produk' },
  { key: 'categories', label: 'Kategori' },
  { key: 'units', label: 'Unit' },
] as const

export function ProductsPage() {
  const [filter, setFilter] = useState<ProductFilter>({})
  const { page, pageSize, onPageChange, onPageSizeChange, reset } = usePagination()
  const {
    activeTab,
    setActiveTab,
    openProductModal,
    productModalOpen,
    editingProductId,
    closeProductModal,
    deleteConfirmOpen,
    deleteTarget,
    closeDeleteConfirm,
  } = useProductsStore()

  const { data: productData, isLoading } = useProductListQuery({ ...filter, page, page_size: pageSize })
  const { data: categories = [] } = useCategoryListQuery()
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProductMutation()

  const products = productData?.data?.data ?? []
  const total = productData?.data?.total ?? 0

  const handleFilterChange = (newFilter: ProductFilter) => {
    setFilter(newFilter)
    reset()
  }

  const handleReset = () => {
    setFilter({})
    reset()
  }

  const handleDelete = () => {
    if (deleteTarget?.type === 'product') {
      deleteProduct(deleteTarget.id, { onSuccess: () => closeDeleteConfirm() })
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Produk"
        breadcrumbs={[{ label: 'Inventori' }, { label: 'Produk' }]}
        actions={
          <RoleGuard allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
            <Button onClick={() => openProductModal()} className="gap-1">
              <Plus size={16} />
              Tambah Produk
            </Button>
          </RoleGuard>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-[#2c3e50] text-[#2c3e50]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'products' && (
        <div className="space-y-3">
          <ProductFilterBar
            filter={filter}
            onChange={handleFilterChange}
            onReset={handleReset}
            categories={categories}
          />
          <ProductTable
            data={products}
            isLoading={isLoading}
            pagination={{
              page,
              pageSize,
              total,
              onPageChange,
              onPageSizeChange,
              pageSizeOptions: [10, 20, 50],
            }}
          />
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-400">
          Manajemen Kategori — Coming in FASE 15
        </div>
      )}

      {activeTab === 'units' && (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-400">
          Manajemen Unit — Coming in FASE 15
        </div>
      )}

      {/* Product form modal */}
      <ProductFormModal
        open={productModalOpen}
        onOpenChange={(open) => { if (!open) closeProductModal() }}
        productId={editingProductId ?? undefined}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => { if (!open) closeDeleteConfirm() }}
        title="Hapus Produk"
        description="Produk yang dihapus tidak bisa dikembalikan. Yakin ingin melanjutkan?"
        confirmLabel="Ya, Hapus"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
