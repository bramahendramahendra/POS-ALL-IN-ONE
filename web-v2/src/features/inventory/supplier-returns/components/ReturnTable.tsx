import { Eye, Trash2 } from 'lucide-react'

import { DataTable } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { formatRupiah } from '@/shared/utils'
import type { ColumnDef, PaginationProps } from '@/shared/components/DataTable/DataTable.types'

import type { SupplierReturn } from '../supplier-returns.types'

interface ReturnTableProps {
  data: SupplierReturn[]
  isLoading: boolean
  pagination: PaginationProps
  onDetail: (row: SupplierReturn) => void
  onDelete: (row: SupplierReturn) => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const STATUS_LABEL: Record<SupplierReturn['status'], string> = {
  pending: 'Pending',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

const STATUS_CLASS: Record<SupplierReturn['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
}

export function ReturnTable({ data, isLoading, pagination, onDetail, onDelete }: ReturnTableProps) {
  const columns: ColumnDef<SupplierReturn>[] = [
    {
      key: 'return_date',
      header: 'Tanggal',
      cell: (row) => <span className="text-sm text-gray-600">{formatDate(row.return_date)}</span>,
    },
    {
      key: 'return_code',
      header: 'Kode Retur',
      cell: (row) => (
        <span className="text-sm font-mono font-medium text-blue-700">{row.return_code}</span>
      ),
    },
    {
      key: 'supplier_name',
      header: 'Supplier',
      cell: (row) => <span className="text-sm">{row.supplier_name}</span>,
    },
    {
      key: 'total_return_amount',
      header: 'Total Retur',
      align: 'right',
      cell: (row) => (
        <span className="text-sm font-semibold text-red-600">
          {formatRupiah(row.total_return_amount)}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Alasan',
      cell: (row) => <span className="text-sm text-gray-600">{row.reason}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      cell: (row) => (
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[row.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
        >
          {STATUS_LABEL[row.status] ?? row.status}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Aksi',
      align: 'center',
      cell: (row) => (
        <div className="flex gap-1 justify-center">
          <Button variant="ghost" size="sm" onClick={() => onDetail(row)} title="Detail">
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === 'pending' && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(row)} title="Hapus">
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
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
