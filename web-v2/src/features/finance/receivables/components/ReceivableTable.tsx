import { DataTable, StatusBadge } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { formatRupiah } from '@/shared/utils'
import type { ColumnDef, PaginationProps } from '@/shared/components/DataTable/DataTable.types'

import type { Receivable } from '../receivables.types'

interface ReceivableTableProps {
  data: Receivable[]
  isLoading: boolean
  pagination: PaginationProps
  onPay: (receivable: Receivable) => void
}

function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function ReceivableTable({ data, isLoading, pagination, onPay }: ReceivableTableProps) {
  const columns: ColumnDef<Receivable>[] = [
    {
      key: 'transaction_code',
      header: 'Kode Transaksi',
      cell: (row) => (
        <span className="font-mono font-semibold text-sm text-gray-800">
          {row.transaction_code}
        </span>
      ),
    },
    {
      key: 'customer_name',
      header: 'Pelanggan',
      cell: (row) => <span className="font-medium">{row.customer_name}</span>,
    },
    {
      key: 'total_amount',
      header: 'Total Piutang',
      align: 'right',
      cell: (row) => <span>{formatRupiah(row.total_amount)}</span>,
    },
    {
      key: 'paid_amount',
      header: 'Sudah Dibayar',
      align: 'right',
      cell: (row) => <span className="text-green-600">{formatRupiah(row.paid_amount)}</span>,
    },
    {
      key: 'remaining_amount',
      header: 'Sisa',
      align: 'right',
      cell: (row) => (
        <span className={row.remaining_amount > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
          {formatRupiah(row.remaining_amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'due_date',
      header: 'Jatuh Tempo',
      cell: (row) =>
        row.due_date ? (
          <span
            className={
              isOverdue(row.due_date) && row.status !== 'paid'
                ? 'text-red-600 font-medium'
                : 'text-gray-600'
            }
          >
            {formatDate(row.due_date)}
            {isOverdue(row.due_date) && row.status !== 'paid' && ' ⚠'}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'center',
      width: '80px',
      cell: (row) =>
        row.status !== 'paid' ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs"
            onClick={() => onPay(row)}
          >
            Bayar
          </Button>
        ) : null,
    },
  ]

  return (
    <DataTable<Receivable & Record<string, unknown>>
      columns={columns}
      data={data as (Receivable & Record<string, unknown>)[]}
      isLoading={isLoading}
      emptyMessage="Belum ada piutang"
      emptyDescription="Piutang akan muncul saat transaksi dilakukan dengan metode kredit."
      pagination={pagination}
    />
  )
}
