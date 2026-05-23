import { useState } from 'react'
import { Plus, Upload } from 'lucide-react'

import { ROLES } from '@/shared/constants'
import { ConfirmDialog, PageHeader, RoleGuard } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { usePagination, useDisclosure } from '@/shared/hooks'

import { useCategoryListQuery, useDeleteProductMutation, useProductListQuery } from './products.api'
import { useProductsStore } from './products.store'
import type { Product, ProductFilter } from './products.types'
import { ImportCsvModal } from './components/ImportCsvModal'
import { LabelPrintModal } from './components/LabelPrintModal'
import { ProductFilterBar } from './components/ProductFilter'
import { ProductFormModal } from './components/ProductFormModal'
import { ProductTable } from './components/ProductTable'

export function ProductsPage() {
  const [filter, setFilter] = useState<ProductFilter>({})
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const { page, pageSize, onPageChange, onPageSizeChange, reset } = usePagination()
  const {
    openProductModal,
    productModalOpen,
    editingProductId,
    closeProductModal,
    deleteConfirmOpen,
    deleteTarget,
    closeDeleteConfirm,
  } = useProductsStore()

  const { isOpen: importOpen, open: openImport, close: closeImport } = useDisclosure()
  const { isOpen: labelOpen, open: openLabel, close: closeLabel } = useDisclosure()

  const { data: productData, isLoading } = useProductListQuery({
    ...filter,
    page,
    page_size: pageSize,
  })
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={openImport} className="gap-1">
                <Upload size={16} />
                Import CSV
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
          onImportCsv={() => openImport()}
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
        description="Produk yang dihapus tidak bisa dikembalikan. Yakin ingin melanjutkan?"
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
          if (!open) closeLabel()
        }}
        products={selectedProducts}
      />
    </div>
  )
}
