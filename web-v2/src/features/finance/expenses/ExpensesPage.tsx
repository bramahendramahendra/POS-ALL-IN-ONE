import { useState } from 'react'
import { Plus } from 'lucide-react'

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

import { useExpensesQuery, useDeleteExpenseMutation } from './expenses.api'
import type { Expense, ExpenseCategory, ExpenseFilter } from './expenses.types'
import { ExpenseTable } from './components/ExpenseTable'
import { ExpenseFormModal } from './components/ExpenseFormModal'

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

function monthStartString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const CATEGORIES: { value: ExpenseCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'operasional', label: 'Operasional' },
  { value: 'pembelian', label: 'Pembelian' },
  { value: 'gaji', label: 'Gaji' },
  { value: 'lainnya', label: 'Lainnya' },
]

export function ExpensesPage() {
  const today = todayString()

  const [dateFrom, setDateFrom] = useState(monthStartString())
  const [dateTo, setDateTo] = useState(today)
  const [category, setCategory] = useState<ExpenseCategory | 'all'>('all')

  const { page, pageSize, onPageChange, onPageSizeChange, reset } = usePagination()
  const { isOpen: formOpen, open: openForm, close: closeForm } = useDisclosure()
  const { isOpen: deleteOpen, open: openDelete, close: closeDelete } = useDisclosure()

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)

  const filter: ExpenseFilter = {
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    category: category === 'all' ? undefined : category,
    page,
    page_size: pageSize,
  }

  const { data, isLoading } = useExpensesQuery(filter)
  const { mutate: deleteExpense, isPending: isDeleting } = useDeleteExpenseMutation()

  const items: Expense[] = data?.data?.data ?? []
  const total = data?.data?.total ?? 0

  function handleEdit(expense: Expense) {
    setEditingExpense(expense)
    openForm()
  }

  function handleDelete(expense: Expense) {
    setDeletingExpense(expense)
    openDelete()
  }

  function handleFormClose() {
    closeForm()
    setEditingExpense(null)
  }

  function confirmDelete() {
    if (!deletingExpense) return
    deleteExpense(deletingExpense.id, {
      onSuccess: () => {
        closeDelete()
        setDeletingExpense(null)
      },
    })
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pengeluaran"
        breadcrumbs={[{ label: 'Finance' }, { label: 'Pengeluaran' }]}
        actions={
          <RoleGuard allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
            <Button onClick={openForm} className="gap-1">
              <Plus size={16} />
              Tambah Pengeluaran
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
            onChange={(e) => { setDateFrom(e.target.value); reset() }}
            className="w-40 h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Sampai</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); reset() }}
            className="w-40 h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Kategori</label>
          <Select
            value={category}
            onValueChange={(v) => { setCategory(v as ExpenseCategory | 'all'); reset() }}
          >
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ExpenseTable
        data={items}
        isLoading={isLoading}
        pagination={{ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions: [10, 20, 50] }}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ExpenseFormModal open={formOpen} expense={editingExpense} onClose={handleFormClose} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDelete()
            setDeletingExpense(null)
          }
        }}
        title="Hapus Pengeluaran"
        description={`Yakin ingin menghapus pengeluaran "${deletingExpense?.description}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
