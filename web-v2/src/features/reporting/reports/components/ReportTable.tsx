import { DataTable } from '@/shared/components'
import { formatRupiah } from '@/shared/utils'
import type { ColumnDef, PaginationProps } from '@/shared/components/DataTable/DataTable.types'

import type {
  CashierReportRow,
  ProductReportRow,
  ReportType,
  SalesReportRow,
} from '../reports.types'

type AnyRow = SalesReportRow | ProductReportRow | CashierReportRow

interface ReportTableProps {
  reportType: ReportType
  data: AnyRow[]
  isLoading: boolean
  pagination: PaginationProps
}

const salesColumns: ColumnDef<SalesReportRow>[] = [
  {
    key: 'period',
    header: 'Periode',
    cell: (r) => <span className="font-medium">{r.period}</span>,
  },
  {
    key: 'total_transactions',
    header: 'Transaksi',
    align: 'right',
    cell: (r) => <span>{r.total_transactions}</span>,
  },
  {
    key: 'total_revenue',
    header: 'Pendapatan',
    align: 'right',
    cell: (r) => <span>{formatRupiah(r.total_revenue)}</span>,
  },
  {
    key: 'total_discount',
    header: 'Diskon',
    align: 'right',
    cell: (r) => <span className="text-green-600">-{formatRupiah(r.total_discount)}</span>,
  },
  {
    key: 'total_tax',
    header: 'Pajak',
    align: 'right',
    cell: (r) => <span className="text-gray-500">+{formatRupiah(r.total_tax)}</span>,
  },
  {
    key: 'net_revenue',
    header: 'Net',
    align: 'right',
    cell: (r) => <span className="font-semibold text-blue-600">{formatRupiah(r.net_revenue)}</span>,
  },
]

const productColumns: ColumnDef<ProductReportRow>[] = [
  {
    key: 'product_name',
    header: 'Produk',
    cell: (r) => <span className="font-medium">{r.product_name}</span>,
  },
  {
    key: 'unit_name',
    header: 'Unit',
    cell: (r) => <span className="text-gray-500 text-sm">{r.unit_name}</span>,
  },
  {
    key: 'qty_sold',
    header: 'Qty Terjual',
    align: 'right',
    cell: (r) => <span>{r.qty_sold}</span>,
  },
  {
    key: 'revenue',
    header: 'Pendapatan',
    align: 'right',
    cell: (r) => <span className="font-semibold">{formatRupiah(r.revenue)}</span>,
  },
  {
    key: 'avg_price',
    header: 'Harga Rata-rata',
    align: 'right',
    cell: (r) => <span>{formatRupiah(r.avg_price)}</span>,
  },
]

const cashierColumns: ColumnDef<CashierReportRow>[] = [
  {
    key: 'kasir_name',
    header: 'Kasir',
    cell: (r) => <span className="font-medium">{r.kasir_name}</span>,
  },
  {
    key: 'total_transactions',
    header: 'Transaksi',
    align: 'right',
    cell: (r) => <span>{r.total_transactions}</span>,
  },
  {
    key: 'total_revenue',
    header: 'Pendapatan',
    align: 'right',
    cell: (r) => (
      <span className="font-semibold text-blue-600">{formatRupiah(r.total_revenue)}</span>
    ),
  },
]

export function ReportTable({ reportType, data, isLoading, pagination }: ReportTableProps) {
  if (reportType === 'sales') {
    return (
      <DataTable<SalesReportRow & Record<string, unknown>>
        columns={salesColumns}
        data={data as (SalesReportRow & Record<string, unknown>)[]}
        isLoading={isLoading}
        emptyMessage="Belum ada data laporan penjualan"
        pagination={pagination}
      />
    )
  }

  if (reportType === 'products') {
    return (
      <DataTable<ProductReportRow & Record<string, unknown>>
        columns={productColumns}
        data={data as (ProductReportRow & Record<string, unknown>)[]}
        isLoading={isLoading}
        emptyMessage="Belum ada data laporan produk"
        pagination={pagination}
      />
    )
  }

  return (
    <DataTable<CashierReportRow & Record<string, unknown>>
      columns={cashierColumns}
      data={data as (CashierReportRow & Record<string, unknown>)[]}
      isLoading={isLoading}
      emptyMessage="Belum ada data laporan kasir"
      pagination={pagination}
    />
  )
}
