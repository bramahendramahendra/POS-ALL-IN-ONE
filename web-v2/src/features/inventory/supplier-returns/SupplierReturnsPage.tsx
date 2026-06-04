import { useState } from 'react'
import { Plus, Truck } from 'lucide-react'

import { ROLES } from '@/shared/constants'
import { ConfirmDialog, PageHeader, RoleGuard } from '@/shared/components'
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
import { useProductListQuery } from '@/features/inventory/products/products.api'

import { useSupplierReturnsQuery, useDeleteSupplierReturnMutation } from './supplier-returns.api'
import type { SupplierReturn, SupplierReturnFilter } from './supplier-returns.types'
import { ReturnTable } from './components/ReturnTable'
import { ReturnFormModal } from './components/ReturnFormModal'
import { ReturnDetailModal } from './components/ReturnDetailModal'

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
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { page, pageSize, onPageChange, onPageSizeChange } = usePagination()
  const { isOpen: formOpen, open: openForm, close: closeForm } = useDisclosure()
  const { isOpen: deleteOpen, open: openDelete, close: closeDelete } = useDisclosure()
  const { isOpen: detailOpen, open: openDetail, close: closeDetail } = useDisclosure()

  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)

  const { data: suppliersData, isLoading: isSuppliersLoading } = useSupplierListQuery({ page_size: 200 })
  const { data: productsData, isLoading: isProductsLoading } = useProductListQuery({ page_size: 1 })
  const suppliers = suppliersData?.items ?? []
  const hasSuppliers = suppliers.length > 0
  const hasProducts = (productsData?.total ?? 0) > 0

  const filter: SupplierReturnFilter = {
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    supplier_id: supplierId,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    page_size: pageSize,
  }

  const { data, isLoading } = useSupplierReturnsQuery(filter)
  const { mutate: deleteReturn, isPending: isDeleting } = useDeleteSupplierReturnMutation()

  const returns = data?.items ?? []
  const total = data?.total ?? 0

  function handleDetail(row: SupplierReturn) {
    setDetailId(row.id)
    openDetail()
  }

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

  if (isSuppliersLoading || isProductsLoading) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Retur Pembelian"
          breadcrumbs={[{ label: 'Inventori' }, { label: 'Retur' }]}
        />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  if (!hasSuppliers || !hasProducts) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Retur Pembelian"
          breadcrumbs={[{ label: 'Inventori' }, { label: 'Retur' }]}
        />
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-white px-6 py-16 text-center">
          <div className="mb-4 flex gap-3">
            <div className="rounded-full p-3 bg-amber-50">
              <Truck size={24} className="text-amber-500" />
            </div>
          </div>
          <h3 className="mb-1 text-base font-semibold text-gray-800">
            Belum bisa menambah retur
          </h3>
          <p className="mb-1 text-sm text-gray-500">
            Sebelum menambah retur, pastikan data berikut sudah tersedia:
          </p>
          <ul className="mb-6 space-y-1 text-sm">
            {!hasSuppliers && (
              <li className="flex items-center gap-2 text-amber-600">
                <span>!</span>
                Belum ada supplier — tambahkan di menu Supplier
              </li>
            )}
            {!hasProducts && (
              <li className="flex items-center gap-2 text-amber-600">
                <span>!</span>
                Belum ada produk — tambahkan di menu Produk
              </li>
            )}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Retur Pembelian"
        breadcrumbs={[{ label: 'Inventori' }, { label: 'Retur' }]}
        actions={
          <RoleGuard allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
            <Button onClick={openForm} className="gap-1">
              <Plus size={16} />
              Tambah Retur
            </Button>
          </RoleGuard>
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
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ReturnTable
        data={returns}
        isLoading={isLoading}
        pagination={{ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions: [10, 20, 50] }}
        onDetail={handleDetail}
        onDelete={handleDelete}
      />

      <ReturnFormModal open={formOpen} onOpenChange={(o) => !o && closeForm()} />

      <ReturnDetailModal
        returnId={detailId}
        open={detailOpen}
        onOpenChange={(o) => {
          if (!o) {
            closeDetail()
            setDetailId(null)
          }
        }}
      />

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
