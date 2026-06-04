import { useState } from 'react'
import { Download } from 'lucide-react'

import { DataTable } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { formatRupiah } from '@/shared/utils'
import { usePagination } from '@/shared/hooks'
import type { ColumnDef } from '@/shared/components/DataTable/DataTable.types'

import { useSalesReportQuery } from '../reports.api'
import type { SalesReport, SalesReportFilter } from '../reports.types'

function monthStart() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PAYMENT_METHODS = [
  { value: 'cash',     label: 'Tunai' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'card',     label: 'Kartu' },
  { value: 'qris',     label: 'QRIS' },
  { value: 'kredit',   label: 'Kredit' },
]

function exportCSV(data: SalesReport[]) {
  const headers = ['Tanggal', 'Kode Transaksi', 'Kasir', 'Customer', 'Total', 'Metode Bayar', 'Status']
  const rows = data.map((r) => [
    formatDate(r.transaction_date),
    r.transaction_code,
    r.cashier_name,
    r.customer_name ?? '-',
    r.total_amount,
    r.payment_method,
    r.status,
  ])
  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `laporan-penjualan-${todayStr()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

interface SummaryCardProps {
  label: string
  value: string
  isLoading: boolean
}

function SummaryCard({ label, value, isLoading }: SummaryCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4 space-y-1">
      <p className="text-xs text-gray-500">{label}</p>
      {isLoading ? (
        <div className="h-7 w-28 animate-pulse rounded bg-gray-100" />
      ) : (
        <p className="text-xl font-bold text-gray-800">{value}</p>
      )}
    </div>
  )
}

export function SalesReportTab() {
  const [dateFrom, setDateFrom] = useState(monthStart())
  const [dateTo, setDateTo] = useState(todayStr())
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>()
  const { page, pageSize, onPageChange, onPageSizeChange } = usePagination()

  const filter: SalesReportFilter = {
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    payment_method: paymentMethod,
    page,
    page_size: pageSize,
  }

  const { data, isLoading } = useSalesReportQuery(filter)
  const items: SalesReport[] = data?.data?.items ?? []
  const total = data?.data?.total ?? 0
  const summary = data?.data?.summary

  const columns: ColumnDef<SalesReport>[] = [
    {
      key: 'transaction_date',
      header: 'Tanggal',
      cell: (r) => <span className="text-sm text-gray-600">{formatDate(r.transaction_date)}</span>,
    },
    {
      key: 'transaction_code',
      header: 'Kode Transaksi',
      cell: (r) => <span className="text-sm font-mono font-medium">{r.transaction_code}</span>,
    },
    {
      key: 'cashier_name',
      header: 'Kasir',
      cell: (r) => <span className="text-sm">{r.cashier_name}</span>,
    },
    {
      key: 'customer_name',
      header: 'Customer',
      cell: (r) => <span className="text-sm text-gray-500">{r.customer_name ?? '-'}</span>,
    },
    {
      key: 'total_amount',
      header: 'Total',
      align: 'right',
      cell: (r) => <span className="text-sm font-semibold">{formatRupiah(r.total_amount)}</span>,
    },
    {
      key: 'payment_method',
      header: 'Metode Bayar',
      cell: (r) => <span className="text-sm capitalize">{r.payment_method}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      cell: (r) =>
        r.status === 'completed' ? (
          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            Selesai
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            Void
          </span>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Dari</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-36 h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Sampai</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-36 h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Metode Bayar</label>
          <Select
            value={paymentMethod ?? 'all'}
            onValueChange={(v) => setPaymentMethod(v === 'all' ? undefined : v)}
          >
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Semua" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => exportCSV(items)}
          disabled={items.length === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label="Total Transaksi"
          value={String(summary?.total_transactions ?? 0)}
          isLoading={isLoading}
        />
        <SummaryCard
          label="Total Pendapatan"
          value={formatRupiah(summary?.total_revenue ?? 0)}
          isLoading={isLoading}
        />
        <SummaryCard
          label="Rata-rata per Transaksi"
          value={formatRupiah(summary?.avg_per_transaction ?? 0)}
          isLoading={isLoading}
        />
      </div>

      {/* Table */}
      <DataTable<SalesReport & Record<string, unknown>>
        columns={columns}
        data={items as (SalesReport & Record<string, unknown>)[]}
        isLoading={isLoading}
        emptyMessage="Belum ada data penjualan"
        emptyDescription="Data penjualan akan muncul sesuai filter periode yang dipilih."
        pagination={{ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions: [10, 25, 50] }}
      />
    </div>
  )
}
