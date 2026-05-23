import { DataTable } from '@/shared/components'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { formatRupiah } from '@/shared/utils'
import type { ColumnDef, PaginationProps } from '@/shared/components/DataTable/DataTable.types'

import type { CashDrawer } from '../cash-drawer.types'

interface CashDrawerTableProps {
  data: CashDrawer[]
  isLoading: boolean
  pagination: PaginationProps
  onRowClick: (row: CashDrawer) => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function CashDrawerTable({ data, isLoading, pagination, onRowClick }: CashDrawerTableProps) {
  const columns: ColumnDef<CashDrawer>[] = [
    {
      key: 'date',
      header: 'Tanggal',
      cell: (row) => <span className="text-gray-600 text-sm">{formatDate(row.date)}</span>,
    },
    {
      key: 'shift',
      header: 'Shift',
      align: 'center',
      cell: (row) => {
        const labels: Record<string, string> = { pagi: 'Pagi', siang: 'Siang', malam: 'Malam' }
        return (
          <span className="text-sm text-gray-600">
            {row.shift ? (labels[row.shift] ?? row.shift) : '—'}
          </span>
        )
      },
    },
    {
      key: 'opening_balance',
      header: 'Saldo Buka',
      align: 'right',
      cell: (row) => <span className="text-sm">{formatRupiah(row.opening_balance)}</span>,
    },
    {
      key: 'total_in',
      header: 'Total Masuk',
      align: 'right',
      cell: (row) => (
        <span className="text-green-600 font-medium text-sm">{formatRupiah(row.total_in)}</span>
      ),
    },
    {
      key: 'total_out',
      header: 'Total Keluar',
      align: 'right',
      cell: (row) => (
        <span className="text-red-600 font-medium text-sm">{formatRupiah(row.total_out)}</span>
      ),
    },
    {
      key: 'closing_balance',
      header: 'Saldo Tutup',
      align: 'right',
      cell: (row) => (
        <span className="font-semibold text-sm">
          {row.status === 'closed' ? formatRupiah(row.closing_balance) : '—'}
        </span>
      ),
    },
    {
      key: 'difference',
      header: 'Selisih',
      align: 'right',
      cell: (row) => (
        <span
          className={`text-sm font-medium ${
            row.difference === 0
              ? 'text-gray-500'
              : row.difference > 0
                ? 'text-green-600'
                : 'text-red-600'
          }`}
        >
          {row.difference > 0 ? '+' : ''}
          {formatRupiah(row.difference)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      cell: (row) =>
        row.status === 'closed' ? (
          <Badge variant="secondary">Tutup</Badge>
        ) : (
          <Badge variant="default">Buka</Badge>
        ),
    },
    {
      key: 'id',
      header: 'Aksi',
      align: 'center',
      cell: (row) => (
        <Button variant="ghost" size="sm" onClick={() => onRowClick(row)}>
          Detail
        </Button>
      ),
    },
  ]

  return (
    <DataTable<CashDrawer & Record<string, unknown>>
      columns={columns}
      data={data as (CashDrawer & Record<string, unknown>)[]}
      isLoading={isLoading}
      emptyMessage="Belum ada data kas harian"
      emptyDescription="Data kas harian akan muncul sesuai filter periode yang dipilih."
      pagination={pagination}
    />
  )
}
