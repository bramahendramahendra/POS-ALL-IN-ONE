import { useState } from 'react'
import { Plus, RotateCcw, Search } from 'lucide-react'

import { ROLES } from '@/shared/constants'
import { ConfirmDialog, PageHeader, RoleGuard } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useDebounce, useDisclosure, usePagination } from '@/shared/hooks'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

import { useDeleteSupplierMutation, useSupplierListQuery, useToggleSupplierStatusMutation } from './suppliers.api'
import type { Supplier } from './suppliers.types'
import { SupplierDetailModal } from './components/SupplierDetailModal'
import { SupplierFormModal } from './components/SupplierFormModal'
import { SupplierTable } from './components/SupplierTable'

export function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState<'all' | 'true' | 'false'>('all')
  const debouncedSearch = useDebounce(search, 300)
  const { page, pageSize, onPageChange, onPageSizeChange, reset } = usePagination()
  const { isOpen: detailOpen, open: openDetail, close: closeDetail } = useDisclosure()
  const { isOpen: formOpen, open: openForm, close: closeForm } = useDisclosure()
  const { isOpen: deleteOpen, open: openDelete, close: closeDelete } = useDisclosure()
  const [detailId, setDetailId] = useState<number | null>(null)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filter = {
    search: debouncedSearch || undefined,
    is_active: isActiveFilter === 'all' ? undefined : isActiveFilter === 'true',
    page,
    page_size: pageSize,
  }
  const { data: supplierData, isLoading } = useSupplierListQuery(filter)
  const { mutate: deleteSupplier, isPending: isDeleting } = useDeleteSupplierMutation()
  const { mutate: toggleStatus } = useToggleSupplierStatusMutation()

  const suppliers = supplierData?.items ?? []
  const total = supplierData?.total ?? 0

  const handleSearchChange = (value: string) => {
    setSearch(value)
    reset()
  }

  const handleToggleStatus = (id: number) => {
    toggleStatus(id)
  }

  const handleOpenDetail = (id: number) => {
    setDetailId(id)
    openDetail()
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
        <Select
          value={isActiveFilter}
          onValueChange={(v) => setIsActiveFilter(v as 'all' | 'true' | 'false')}
        >
          <SelectTrigger className="w-36 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="true">Aktif</SelectItem>
            <SelectItem value="false">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
        {(search || isActiveFilter !== 'all') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { handleSearchChange(''); setIsActiveFilter('all') }}
            className="h-9 gap-1"
          >
            <RotateCcw size={13} />
            Reset
          </Button>
        )}
      </div>

      <SupplierTable
        data={suppliers}
        isLoading={isLoading}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange,
          onPageSizeChange,
          pageSizeOptions: [10, 20, 50],
        }}
        onDetail={handleOpenDetail}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        onToggleStatus={handleToggleStatus}
      />

      <SupplierDetailModal
        open={detailOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDetail()
            setDetailId(null)
          }
        }}
        supplierId={detailId ?? undefined}
      />

      <SupplierFormModal
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseForm()
        }}
        supplierId={editingSupplier?.id}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDelete()
            setDeletingId(null)
          }
        }}
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
