import { useState } from 'react'
import { Plus } from 'lucide-react'

import { ConfirmDialog, PageHeader } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useDisclosure, usePagination } from '@/shared/hooks'
import { useSupplierListQuery } from '@/features/inventory/suppliers/suppliers.api'

import { useSupplierReturnsQuery, useDeleteSupplierReturnMutation } from './supplier-returns.api'
import type { SupplierReturn, SupplierReturnFilter } from './supplier-returns.types'
import { ReturnTable } from './components/ReturnTable'
import { ReturnFormModal } from './components/ReturnFormModal'

function monthStartString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function todayString() {
  return new Date().toISOString().split('T')[0]
}

export function SupplierReturnsPage() {
  const today = todayString()
  const [dateFrom, setDateFrom] = useState(monthStartString())
  const [dateTo, setDateTo] = useState(today)
  const [supplierId, setSupplierId] = useState<number | undefined>()

  const { page, pageSize, onPageChange, onPageSizeChange } = usePagination()
  const { isOpen: formOpen, open: openForm, close: closeForm } = useDisclosure()
  const { isOpen: deleteOpen, open: openDelete, close: closeDelete } = useDisclosure()

  const [deletingId, setDeletingId] = useState<number | null>(null)

  const { data: suppliersData } = useSupplierListQuery({ page_size: 200 })
  const suppliers = suppliersData?.data?.data ?? []

  const filter: SupplierReturnFilter = {
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    supplier_id: supplierId,
    page,
    page_size: pageSize,
  }

  const { data, isLoading } = useSupplierReturnsQuery(filter)
  const { mutate: deleteReturn, isPending: isDeleting } = useDeleteSupplierReturnMutation()

  const returns = data?.data?.data ?? []
  const total = data?.data?.total ?? 0

  function handleDelete(row: SupplierReturn) {
    setDeletingId(row.id)
    openDelete()
  }

  function confirmDelete() {
    if (!deletingId) return
    deleteReturn(deletingId, {
      onSuccess: () => {
        closeDelete()
        setDeletingId(null)
      },
    })
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Retur Pembelian"
        breadcrumbs={[{ label: 'Inventori' }, { label: 'Retur' }]}
        actions={
          <Button onClick={openForm} className="gap-1">
            <Plus size={16} />
            Tambah Retur
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Dari</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-36 h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Sampai</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-36 h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Supplier</label>
          <Select
            value={supplierId ? String(supplierId) : 'all'}
            onValueChange={(v) => setSupplierId(v === 'all' ? undefined : Number(v))}
          >
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder="Semua Supplier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Supplier</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ReturnTable
        data={returns}
        isLoading={isLoading}
        pagination={{ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions: [10, 20, 50] }}
        onDelete={handleDelete}
      />

      <ReturnFormModal open={formOpen} onOpenChange={(o) => !o && closeForm()} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          if (!o) {
            closeDelete()
            setDeletingId(null)
          }
        }}
        title="Hapus Retur"
        description="Data retur yang dihapus tidak bisa dikembalikan. Yakin ingin melanjutkan?"
        confirmLabel="Ya, Hapus"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
