import { DataTable } from '@/shared/components'
import { formatRupiah } from '@/shared/utils'
import type { ColumnDef, PaginationProps } from '@/shared/components/DataTable/DataTable.types'

import type { CashflowItem } from '../finance.types'

interface FinanceTableProps {
  data: CashflowItem[]
  isLoading: boolean
  pagination: PaginationProps
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function FinanceTable({ data, isLoading, pagination }: FinanceTableProps) {
  const columns: ColumnDef<CashflowItem>[] = [
    {
      key: 'date',
      header: 'Tanggal',
      cell: (row) => <span className="text-gray-600 text-sm">{formatDate(row.date)}</span>,
    },
    {
      key: 'category',
      header: 'Kategori',
      cell: (row) => <span className="font-medium text-sm">{row.category}</span>,
    },
    {
      key: 'description',
      header: 'Deskripsi',
      cell: (row) => <span className="text-gray-600 text-sm">{row.description}</span>,
    },
    {
      key: 'type',
      header: 'Tipe',
      align: 'center',
      cell: (row) =>
        row.type === 'income' ? (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            Pemasukan
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            Pengeluaran
          </span>
        ),
    },
    {
      key: 'amount',
      header: 'Nominal',
      align: 'right',
      cell: (row) => (
        <span
          className={
            row.type === 'income' ? 'font-semibold text-green-600' : 'font-semibold text-red-600'
          }
        >
          {row.type === 'income' ? '+' : '-'}
          {formatRupiah(row.amount)}
        </span>
      ),
    },
  ]

  return (
    <DataTable<CashflowItem & Record<string, unknown>>
      columns={columns}
      data={data as (CashflowItem & Record<string, unknown>)[]}
      isLoading={isLoading}
      emptyMessage="Belum ada data arus kas"
      emptyDescription="Data arus kas akan muncul sesuai filter periode yang dipilih."
      pagination={pagination}
    />
  )
}
