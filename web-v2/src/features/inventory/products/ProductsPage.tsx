import { useState } from 'react'
import { Plus, Upload, Tag, Ruler } from 'lucide-react'

import { ROLES } from '@/shared/constants'
import { ConfirmDialog, PageHeader, RoleGuard } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { usePagination, useDisclosure } from '@/shared/hooks'

import { useCategoryListQuery, useDeleteProductMutation, useProductListQuery, useUnitListQuery } from './products.api'
import { useProductsStore } from './products.store'
import type { Product, ProductFilter } from './products.types'
import { ImportCsvModal } from './components/ImportCsvModal'
import { LabelPrintModal } from './components/LabelPrintModal'
import { ProductDetailModal } from './components/ProductDetailModal'
import { ProductFilterBar } from './components/ProductFilter'
import { ProductFormModal } from './components/ProductFormModal'
import { ProductTable } from './components/ProductTable'

export function ProductsPage() {
  const [filter, setFilter] = useState<ProductFilter>({})
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [singleLabelProduct, setSingleLabelProduct] = useState<Product | null>(null)
  const { page, pageSize, onPageChange, onPageSizeChange, reset } = usePagination()
  const {
    openProductModal,
    productModalOpen,
    editingProductId,
    closeProductModal,
    deleteConfirmOpen,
    deleteTarget,
    closeDeleteConfirm,
    detailModalOpen,
    detailProductId,
    openDetailModal,
    closeDetailModal,
  } = useProductsStore()

  const { isOpen: importOpen, open: openImport, close: closeImport } = useDisclosure()
  const { isOpen: labelOpen, open: openLabel, close: closeLabel } = useDisclosure()

  const { data: productData, isLoading } = useProductListQuery({
    ...filter,
    page,
    page_size: pageSize,
  })
  const { data: categories = [], isLoading: isCatLoading } = useCategoryListQuery()
  const { data: units = [], isLoading: isUnitLoading } = useUnitListQuery()
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProductMutation()

  const hasCategories = categories.length > 0
  const hasActiveUnits = units.some((u) => u.is_active)

  const products = productData?.items ?? []
  const total = productData?.total ?? 0

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

  if (isCatLoading || isUnitLoading) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Produk"
          breadcrumbs={[{ label: 'Inventori' }, { label: 'Produk' }]}
        />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  if (!hasCategories || !hasActiveUnits) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Produk"
          breadcrumbs={[{ label: 'Inventori' }, { label: 'Produk' }]}
        />
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-white px-6 py-16 text-center">
          <div className="mb-4 flex gap-3">
            <div className={`rounded-full p-3 ${!hasCategories ? 'bg-amber-50' : 'bg-green-50'}`}>
              <Tag size={24} className={!hasCategories ? 'text-amber-500' : 'text-green-500'} />
            </div>
            <div className={`rounded-full p-3 ${!hasActiveUnits ? 'bg-amber-50' : 'bg-green-50'}`}>
              <Ruler size={24} className={!hasActiveUnits ? 'text-amber-500' : 'text-green-500'} />
            </div>
          </div>
          <h3 className="mb-1 text-base font-semibold text-gray-800">
            Belum bisa menambah produk
          </h3>
          <p className="mb-1 text-sm text-gray-500">
            Sebelum menambah produk, pastikan data berikut sudah tersedia:
          </p>
          <ul className="mb-6 text-sm">
            <li className={`flex items-center gap-2 ${hasCategories ? 'text-green-600' : 'text-amber-600'}`}>
              <span>{hasCategories ? '✓' : '!'}</span>
              {hasCategories ? 'Kategori sudah tersedia' : 'Belum ada kategori — tambahkan di tab Kategori'}
            </li>
            <li className={`flex items-center gap-2 ${hasActiveUnits ? 'text-green-600' : 'text-amber-600'}`}>
              <span>{hasActiveUnits ? '✓' : '!'}</span>
              {hasActiveUnits ? 'Satuan sudah tersedia' : 'Belum ada satuan aktif — tambahkan di tab Satuan'}
            </li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Produk"
        breadcrumbs={[{ label: 'Inventori' }, { label: 'Produk' }]}
        actions={
          <RoleGuard allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
            <div className="flex gap-2">
              <Button variant="outline" onClick={openImport} className="gap-1">
                <Upload size={16} />
                Import Produk
              </Button>
              <Button onClick={() => openProductModal()} className="gap-1">
                <Plus size={16} />
                Tambah Produk
              </Button>
            </div>
          </RoleGuard>
        }
      />

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
          onSelectionChange={setSelectedProducts}
          onPrintLabel={() => openLabel()}
          onDetailProduct={(product) => openDetailModal(product.id)}
          onPrintSingleLabel={(product) => { setSingleLabelProduct(product); openLabel() }}
        />
      </div>

      <ProductFormModal
        open={productModalOpen}
        onOpenChange={(open) => {
          if (!open) closeProductModal()
        }}
        productId={editingProductId ?? undefined}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          if (!open) closeDeleteConfirm()
        }}
        title="Hapus Produk"
        description={`Yakin ingin menghapus produk "${deleteTarget?.name}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />

      <ImportCsvModal
        open={importOpen}
        onOpenChange={(open) => {
          if (!open) closeImport()
        }}
      />

      <LabelPrintModal
        open={labelOpen}
        onOpenChange={(open) => {
          if (!open) { closeLabel(); setSingleLabelProduct(null) }
        }}
        products={singleLabelProduct ? [singleLabelProduct] : selectedProducts}
      />

      <ProductDetailModal
        open={detailModalOpen}
        onOpenChange={(open) => {
          if (!open) closeDetailModal()
        }}
        productId={detailProductId ?? undefined}
      />
    </div>
  )
}
