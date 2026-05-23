import { useState } from 'react'
import { Plus } from 'lucide-react'

import { PageHeader } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'

import { useExpensesQuery, useDeleteExpenseMutation } from './expenses.api'
import type { Expense, ExpenseCategory, ExpenseFilter } from './expenses.types'
import { ExpenseTable } from './components/ExpenseTable'
import { ExpenseFormModal } from './components/ExpenseFormModal'

const PAGE_SIZE = 10

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
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)

  const filter: ExpenseFilter = {
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    category: category === 'all' ? undefined : category,
    page,
    page_size: PAGE_SIZE,
  }

  const { data, isLoading } = useExpensesQuery(filter)
  const deleteMutation = useDeleteExpenseMutation()

  const items: Expense[] = data?.data?.data ?? []
  const total = data?.data?.total ?? 0

  function handleEdit(expense: Expense) {
    setEditingExpense(expense)
    setFormOpen(true)
  }

  function handleDelete(expense: Expense) {
    setDeletingExpense(expense)
  }

  function confirmDelete() {
    if (!deletingExpense) return
    deleteMutation.mutate(deletingExpense.id, {
      onSuccess: () => setDeletingExpense(null),
    })
  }

  function handleFormClose() {
    setFormOpen(false)
    setEditingExpense(null)
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Pengeluaran"
        breadcrumbs={[{ label: 'Finance' }, { label: 'Pengeluaran' }]}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Tambah Pengeluaran
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Dari</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setPage(1)
            }}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Sampai</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setPage(1)
            }}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Kategori</label>
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v as ExpenseCategory | 'all')
              setPage(1)
            }}
          >
            <SelectTrigger className="w-44">
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setDateFrom(monthStartString())
            setDateTo(today)
            setCategory('all')
            setPage(1)
          }}
        >
          Bulan ini
        </Button>
      </div>

      <ExpenseTable
        data={items}
        isLoading={isLoading}
        pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ExpenseFormModal open={formOpen} expense={editingExpense} onClose={handleFormClose} />

      <AlertDialog open={deletingExpense !== null} onOpenChange={(o) => !o && setDeletingExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengeluaran</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus pengeluaran &quot;{deletingExpense?.description}&quot;? Tindakan
              ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
