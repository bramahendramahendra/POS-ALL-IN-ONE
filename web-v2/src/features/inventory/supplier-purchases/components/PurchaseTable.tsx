import { Eye, Trash2 } from 'lucide-react'

import { DataTable } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { formatRupiah } from '@/shared/utils'
import type { ColumnDef, PaginationProps } from '@/shared/components/DataTable/DataTable.types'

import type { Supplier } from '../../suppliers/suppliers.types'
import type { PaymentStatus, SupplierPurchase } from '../supplier-purchases.types'

interface PurchaseTableProps {
  data: SupplierPurchase[]
  isLoading: boolean
  pagination: PaginationProps
  suppliers: Supplier[]
  onDetail: (purchase: SupplierPurchase) => void
  onPay: (purchase: SupplierPurchase) => void
  onDelete: (purchase: SupplierPurchase) => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const STATUS_BADGE: Record<PaymentStatus, { label: string; className: string }> = {
  paid:    { label: 'Lunas',          className: 'bg-green-100 text-green-700' },
  unpaid:  { label: 'Hutang',         className: 'bg-red-100 text-red-700' },
  partial: { label: 'Bayar Sebagian', className: 'bg-yellow-100 text-yellow-700' },
}

export function PurchaseTable({
  data,
  isLoading,
  pagination,
  suppliers,
  onDetail,
  onPay,
  onDelete,
}: PurchaseTableProps) {
  const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]))
  const columns: ColumnDef<SupplierPurchase>[] = [
    {
      key: 'purchase_code',
      header: 'Kode PO',
      cell: (row) => <span className="text-sm font-mono font-medium text-blue-700">{row.purchase_code}</span>,
    },
    {
      key: 'purchase_date',
      header: 'Tanggal',
      cell: (row) => <span className="text-sm text-gray-600">{formatDate(row.purchase_date)}</span>,
    },
    {
      key: 'invoice_number',
      header: 'No. Faktur',
      cell: (row) => <span className="text-sm font-medium">{row.invoice_number}</span>,
    },
    {
      key: 'supplier_name',
      header: 'Supplier',
      cell: (row) => <span className="text-sm">{row.supplier_id ? (supplierMap.get(row.supplier_id) ?? '-') : '-'}</span>,
    },
    {
      key: 'total_amount',
      header: 'Total',
      align: 'right',
      cell: (row) => <span className="text-sm font-semibold">{formatRupiah(row.total_amount)}</span>,
    },
    {
      key: 'payment_status',
      header: 'Status',
      align: 'center',
      cell: (row) => {
        const s = STATUS_BADGE[row.payment_status] ?? { label: row.payment_status, className: 'bg-gray-100 text-gray-600' }
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}
          >
            {s.label}
          </span>
        )
      },
    },
    {
      key: 'remaining_amount',
      header: 'Sisa Hutang',
      align: 'right',
      cell: (row) => (
        <span className={`text-sm ${row.remaining_amount > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
          {formatRupiah(row.remaining_amount)}
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
          {row.payment_status !== 'paid' && (
            <Button variant="outline" size="sm" onClick={() => onPay(row)} className="text-xs h-7 px-2">
              Bayar
            </Button>
          )}
          {row.paid_amount === 0 && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(row)} title="Hapus">
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable<SupplierPurchase & Record<string, unknown>>
      columns={columns}
      data={data as (SupplierPurchase & Record<string, unknown>)[]}
      isLoading={isLoading}
      emptyMessage="Belum ada data pembelian"
      emptyDescription="Data pembelian supplier akan muncul sesuai filter yang dipilih."
      pagination={pagination}
    />
  )
}
