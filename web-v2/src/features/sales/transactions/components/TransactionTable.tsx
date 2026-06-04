import { FileText } from 'lucide-react'

import { ROLES } from '@/shared/constants'
import { DataTable, RoleGuard, StatusBadge } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { formatRupiah } from '@/shared/utils'
import type { ColumnDef, PaginationProps } from '@/shared/components/DataTable/DataTable.types'

import type { PaymentMethod, Transaction } from '../transactions.types'

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tunai',
  transfer: 'Transfer',
  qris: 'QRIS',
  card: 'Kartu',
  kredit: 'Kredit',
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface TransactionTableProps {
  data: Transaction[]
  isLoading: boolean
  pagination: PaginationProps
  onDetail: (transaction: Transaction) => void
  onVoid: (transaction: Transaction) => void
}

export function TransactionTable({
  data,
  isLoading,
  pagination,
  onDetail,
  onVoid,
}: TransactionTableProps) {
  const columns: ColumnDef<Transaction>[] = [
    {
      key: 'transaction_code',
      header: 'Kode',
      cell: (row) => (
        <span className="font-mono font-semibold text-gray-800 text-sm">
          {row.transaction_code}
        </span>
      ),
    },
    {
      key: 'transaction_date',
      header: 'Tanggal',
      cell: (row) => (
        <span className="text-sm text-gray-600">{formatDateTime(row.transaction_date)}</span>
      ),
    },
    {
      key: 'customer_name',
      header: 'Pelanggan',
      cell: (row) =>
        row.customer_name ? (
          <span className="text-sm">{row.customer_name}</span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        ),
    },
    {
      key: 'kasir_name',
      header: 'Kasir',
      cell: (row) => <span className="text-sm">{row.kasir_name}</span>,
    },
    {
      key: 'total_amount',
      header: 'Total',
      align: 'right',
      cell: (row) => <span className="font-semibold">{formatRupiah(row.total_amount)}</span>,
    },
    {
      key: 'payment_method',
      header: 'Metode',
      align: 'center',
      cell: (row) => (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
          {PAYMENT_LABELS[row.payment_method]}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      cell: (row) => <StatusBadge status={row.status === 'completed' ? 'success' : 'error'} />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'center',
      width: '120px',
      cell: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-gray-600 hover:text-blue-600"
            onClick={() => onDetail(row)}
          >
            <FileText size={13} className="mr-1" />
            Detail
          </Button>
          <RoleGuard allowedRoles={[ROLES.OWNER]}>
            {row.status === 'completed' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-gray-500 hover:text-red-600"
                onClick={() => onVoid(row)}
              >
                Void
              </Button>
            )}
          </RoleGuard>
        </div>
      ),
    },
  ]

  return (
    <DataTable<Transaction & Record<string, unknown>>
      columns={columns}
      data={data as (Transaction & Record<string, unknown>)[]}
      isLoading={isLoading}
      emptyMessage="Belum ada transaksi"
      emptyDescription="Transaksi akan muncul setelah proses kasir selesai."
      pagination={pagination}
    />
  )
}
