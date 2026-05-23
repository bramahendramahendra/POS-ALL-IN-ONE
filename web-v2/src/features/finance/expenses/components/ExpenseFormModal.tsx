import { useEffect, useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

import { useCreateExpenseMutation, useUpdateExpenseMutation } from '../expenses.api'
import type { Expense, ExpenseCategory, ExpenseFormData } from '../expenses.types'

interface ExpenseFormModalProps {
  open: boolean
  expense: Expense | null
  onClose: () => void
}

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'operasional', label: 'Operasional' },
  { value: 'pembelian', label: 'Pembelian' },
  { value: 'gaji', label: 'Gaji' },
  { value: 'lainnya', label: 'Lainnya' },
]

function getEmptyForm(): ExpenseFormData {
  return {
    expense_date: todayString(),
    category: 'operasional',
    description: '',
    amount: 0,
    notes: '',
  }
}

export function ExpenseFormModal({ open, expense, onClose }: ExpenseFormModalProps) {
  const isEdit = expense !== null
  const [form, setForm] = useState<ExpenseFormData>(getEmptyForm)

  useEffect(() => {
    if (expense) {
      setForm({
        expense_date: expense.expense_date,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        notes: expense.notes ?? '',
      })
    } else {
      setForm(getEmptyForm())
    }
  }, [expense, open])

  const createMutation = useCreateExpenseMutation()
  const updateMutation = useUpdateExpenseMutation()

  const isPending = createMutation.isPending || updateMutation.isPending

  function handleSubmit() {
    const payload: ExpenseFormData = {
      ...form,
      notes: form.notes || undefined,
    }

    if (isEdit && expense) {
      updateMutation.mutate({ id: expense.id, ...payload }, { onSuccess: onClose })
    } else {
      createMutation.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Tanggal</label>
            <Input
              type="date"
              value={form.expense_date}
              onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-600">Kategori</label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm((f) => ({ ...f, category: v as ExpenseCategory }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
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

          <div className="space-y-1">
            <label className="text-sm text-gray-600">Keterangan</label>
            <Input
              placeholder="Masukkan keterangan pengeluaran"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-600">Jumlah (Rp)</label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={form.amount === 0 ? '' : form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: Number(e.target.value) || 0 }))
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-600">Catatan (opsional)</label>
            <Input
              placeholder="Catatan tambahan..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !form.description || form.amount <= 0}
          >
            {isPending ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
