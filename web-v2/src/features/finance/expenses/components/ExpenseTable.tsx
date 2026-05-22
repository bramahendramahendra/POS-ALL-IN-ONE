import { Pencil, Trash2 } from 'lucide-react'

import { DataTable } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { formatRupiah } from '@/shared/utils'
import type { ColumnDef, PaginationProps } from '@/shared/components/DataTable/DataTable.types'

import type { Expense } from '../expenses.types'

interface ExpenseTableProps {
  data: Expense[]
  isLoading: boolean
  pagination: PaginationProps
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

const CATEGORY_LABEL: Record<string, string> = {
  operasional: 'Operasional',
  pembelian: 'Pembelian',
  gaji: 'Gaji',
  lainnya: 'Lainnya',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function ExpenseTable({ data, isLoading, pagination, onEdit, onDelete }: ExpenseTableProps) {
  const columns: ColumnDef<Expense>[] = [
    {
      key: 'expense_date',
      header: 'Tanggal',
      cell: (row) => <span className="text-gray-600 text-sm">{formatDate(row.expense_date)}</span>,
    },
    {
      key: 'category',
      header: 'Kategori',
      cell: (row) => (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {CATEGORY_LABEL[row.category] ?? row.category}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Keterangan',
      cell: (row) => <span className="text-sm text-gray-700">{row.description}</span>,
    },
    {
      key: 'amount',
      header: 'Jumlah',
      align: 'right',
      cell: (row) => (
        <span className="font-semibold text-red-600 text-sm">{formatRupiah(row.amount)}</span>
      ),
    },
    {
      key: 'created_by_name',
      header: 'Kasir',
      cell: (row) => <span className="text-sm text-gray-500">{row.created_by_name}</span>,
    },
    {
      key: 'id',
      header: 'Aksi',
      align: 'center',
      cell: (row) => (
        <div className="flex gap-1 justify-center">
          <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(row)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DataTable<Expense & Record<string, unknown>>
      columns={columns}
      data={data as (Expense & Record<string, unknown>)[]}
      isLoading={isLoading}
      emptyMessage="Belum ada data pengeluaran"
      emptyDescription="Data pengeluaran akan muncul sesuai filter periode yang dipilih."
      pagination={pagination}
    />
  )
}
