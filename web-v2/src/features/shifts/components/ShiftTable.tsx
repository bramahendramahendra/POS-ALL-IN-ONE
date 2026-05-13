import { DataTable, StatusBadge } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { formatRupiah } from '@/shared/utils'
import type { ColumnDef, PaginationProps } from '@/shared/components/DataTable/DataTable.types'

import type { Shift } from '../shifts.types'

interface ShiftTableProps {
  data: Shift[]
  isLoading: boolean
  pagination: PaginationProps
  onClose: (shift: Shift) => void
}

function formatDateTime(str: string): string {
  return new Date(str).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ShiftTable({ data, isLoading, pagination, onClose }: ShiftTableProps) {
  const columns: ColumnDef<Shift>[] = [
    {
      key: 'kasir_name',
      header: 'Kasir',
      cell: (row) => <span className="font-medium">{row.kasir_name}</span>,
    },
    {
      key: 'opened_at',
      header: 'Buka Shift',
      cell: (row) => <span className="text-sm text-gray-600">{formatDateTime(row.opened_at)}</span>,
    },
    {
      key: 'closed_at',
      header: 'Tutup Shift',
      cell: (row) =>
        row.closed_at ? (
          <span className="text-sm text-gray-600">{formatDateTime(row.closed_at)}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'opening_balance',
      header: 'Modal Awal',
      align: 'right',
      cell: (row) => <span>{formatRupiah(row.opening_balance)}</span>,
    },
    {
      key: 'closing_balance',
      header: 'Modal Akhir',
      align: 'right',
      cell: (row) =>
        row.closing_balance !== undefined ? (
          <span>{formatRupiah(row.closing_balance)}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'total_transactions',
      header: 'Transaksi',
      align: 'right',
      cell: (row) => <span>{row.total_transactions}</span>,
    },
    {
      key: 'total_revenue',
      header: 'Revenue',
      align: 'right',
      cell: (row) => (
        <span className="font-semibold text-blue-600">{formatRupiah(row.total_revenue)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'center',
      width: '90px',
      cell: (row) =>
        row.status === 'open' ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={() => onClose(row)}
          >
            Tutup
          </Button>
        ) : null,
    },
  ]

  return (
    <DataTable<Shift & Record<string, unknown>>
      columns={columns}
      data={data as (Shift & Record<string, unknown>)[]}
      isLoading={isLoading}
      emptyMessage="Belum ada data shift"
      emptyDescription="Shift akan muncul setelah kasir membuka sesi kerja."
      pagination={pagination}
    />
  )
}
