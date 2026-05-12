import { useState } from 'react'
import { Plus, RotateCcw, Search } from 'lucide-react'

import { ROLES } from '@/shared/constants'
import { ConfirmDialog, PageHeader, RoleGuard } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useDebounce, useDisclosure, usePagination } from '@/shared/hooks'

import { useDeleteSupplierMutation, useSupplierListQuery } from './suppliers.api'
import type { Supplier } from './suppliers.types'
import { SupplierFormModal } from './components/SupplierFormModal'
import { SupplierTable } from './components/SupplierTable'

export function SuppliersPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { page, pageSize, onPageChange, onPageSizeChange, reset } = usePagination()
  const { isOpen: formOpen, open: openForm, close: closeForm } = useDisclosure()
  const { isOpen: deleteOpen, open: openDelete, close: closeDelete } = useDisclosure()
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filter = { search: debouncedSearch || undefined, page, page_size: pageSize }
  const { data: supplierData, isLoading } = useSupplierListQuery(filter)
  const { mutate: deleteSupplier, isPending: isDeleting } = useDeleteSupplierMutation()

  const suppliers = supplierData?.data?.data ?? []
  const total = supplierData?.data?.total ?? 0

  const handleSearchChange = (value: string) => {
    setSearch(value)
    reset()
  }

  const handleOpenAdd = () => {
    setEditingSupplier(null)
    openForm()
  }

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    openForm()
  }

  const handleOpenDelete = (id: number) => {
    setDeletingId(id)
    openDelete()
  }

  const handleCloseForm = () => {
    closeForm()
    setEditingSupplier(null)
  }

  const handleDelete = () => {
    if (deletingId === null) return
    deleteSupplier(deletingId, {
      onSuccess: () => {
        closeDelete()
        setDeletingId(null)
      },
    })
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Supplier"
        breadcrumbs={[{ label: 'Inventori' }, { label: 'Supplier' }]}
        actions={
          <RoleGuard allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
            <Button onClick={handleOpenAdd} className="gap-1">
              <Plus size={16} />
              Tambah Supplier
            </Button>
          </RoleGuard>
        }
      />

      {/* Filter */}
      <div className="flex items-center gap-2 rounded-lg border bg-white p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari supplier..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        {search && (
          <Button variant="outline" size="sm" onClick={() => handleSearchChange('')} className="h-9 gap-1">
            <RotateCcw size={13} />
            Reset
          </Button>
        )}
      </div>

      <SupplierTable
        data={suppliers}
        isLoading={isLoading}
        pagination={{ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions: [10, 20, 50] }}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      <SupplierFormModal
        open={formOpen}
        onOpenChange={(open) => { if (!open) handleCloseForm() }}
        supplierId={editingSupplier?.id}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => { if (!open) { closeDelete(); setDeletingId(null) } }}
        title="Hapus Supplier"
        description="Supplier yang dihapus tidak bisa dikembalikan. Yakin ingin melanjutkan?"
        confirmLabel="Ya, Hapus"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
