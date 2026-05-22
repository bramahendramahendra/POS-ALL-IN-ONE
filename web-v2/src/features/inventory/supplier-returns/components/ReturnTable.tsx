import { Trash2 } from 'lucide-react'

import { DataTable } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { formatRupiah } from '@/shared/utils'
import type { ColumnDef, PaginationProps } from '@/shared/components/DataTable/DataTable.types'

import type { SupplierReturn } from '../supplier-returns.types'

interface ReturnTableProps {
  data: SupplierReturn[]
  isLoading: boolean
  pagination: PaginationProps
  onDelete: (row: SupplierReturn) => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function ReturnTable({ data, isLoading, pagination, onDelete }: ReturnTableProps) {
  const columns: ColumnDef<SupplierReturn>[] = [
    {
      key: 'return_date',
      header: 'Tanggal',
      cell: (row) => <span className="text-sm text-gray-600">{formatDate(row.return_date)}</span>,
    },
    {
      key: 'invoice_number',
      header: 'No. Faktur Pembelian',
      cell: (row) => <span className="text-sm font-medium">{row.invoice_number}</span>,
    },
    {
      key: 'supplier_name',
      header: 'Supplier',
      cell: (row) => <span className="text-sm">{row.supplier_name}</span>,
    },
    {
      key: 'total_return',
      header: 'Total Retur',
      align: 'right',
      cell: (row) => (
        <span className="text-sm font-semibold text-red-600">{formatRupiah(row.total_return)}</span>
      ),
    },
    {
      key: 'reason',
      header: 'Alasan',
      cell: (row) => <span className="text-sm text-gray-600">{row.reason}</span>,
    },
    {
      key: 'id',
      header: 'Aksi',
      align: 'center',
      cell: (row) => (
        <Button variant="ghost" size="sm" onClick={() => onDelete(row)} title="Hapus">
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      ),
    },
  ]

  return (
    <DataTable<SupplierReturn & Record<string, unknown>>
      columns={columns}
      data={data as (SupplierReturn & Record<string, unknown>)[]}
      isLoading={isLoading}
      emptyMessage="Belum ada data retur"
      emptyDescription="Data retur pembelian akan muncul sesuai filter yang dipilih."
      pagination={pagination}
    />
  )
}
