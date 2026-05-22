import { useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { formatRupiah } from '@/shared/utils'

import { useProfitLossReportQuery } from '../reports.api'

function monthStart() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

interface PLRowProps {
  label: string
  value: number
  indent?: boolean
  bold?: boolean
  colored?: boolean
}

function PLRow({ label, value, indent = false, bold = false, colored = false }: PLRowProps) {
  const colorClass = colored
    ? value >= 0
      ? 'text-green-600'
      : 'text-red-600'
    : 'text-gray-800'

  return (
    <div
      className={`flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0 ${
        indent ? 'pl-4' : ''
      }`}
    >
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
        {label}
      </span>
      <span className={`text-sm font-medium tabular-nums ${bold ? 'font-bold text-base' : ''} ${colorClass}`}>
        {value < 0 ? '-' : ''}
        {formatRupiah(Math.abs(value))}
      </span>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-2 bg-gray-50 rounded-t-lg border-b">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{children}</p>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded bg-gray-100" />
      ))}
    </div>
  )
}

export function ProfitLossTab() {
  const [dateFrom, setDateFrom] = useState(monthStart())
  const [dateTo, setDateTo] = useState(todayStr())

  const { data, isLoading } = useProfitLossReportQuery({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  })

  const report = data?.data

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => {
              setDateFrom(monthStart())
              setDateTo(todayStr())
            }}
          >
            Bulan ini
          </Button>
        </div>
      </div>

      {/* Report body */}
      {isLoading && <Skeleton />}

      {!isLoading && !report && (
        <div className="py-12 text-center text-sm text-gray-400">
          Belum ada data untuk periode yang dipilih
        </div>
      )}

      {!isLoading && report && (
        <div className="max-w-lg space-y-4">
          {/* Pendapatan */}
          <div className="rounded-lg border bg-white overflow-hidden">
            <SectionHeader>Pendapatan</SectionHeader>
            <div className="px-4">
              <PLRow label="Total Penjualan" value={report.total_sales} />
              <PLRow label="Retur Penjualan" value={-report.total_returns} indent />
              <PLRow
                label="Net Penjualan"
                value={report.total_sales - report.total_returns}
                bold
              />
            </div>
          </div>

          {/* Pengeluaran */}
          <div className="rounded-lg border bg-white overflow-hidden">
            <SectionHeader>Pengeluaran</SectionHeader>
            <div className="px-4">
              <PLRow label="Harga Pokok Penjualan (HPP)" value={report.total_hpp} />
              <PLRow label="Total Pengeluaran (Expense)" value={report.total_expense} />
              <PLRow
                label="Total Pengeluaran"
                value={report.total_hpp + report.total_expense}
                bold
              />
            </div>
          </div>

          {/* Hasil */}
          <div className="rounded-lg border bg-white overflow-hidden">
            <SectionHeader>Hasil</SectionHeader>
            <div className="px-4">
              <PLRow label="Laba Kotor" value={report.gross_profit} bold colored />
              <PLRow label="Laba Bersih" value={report.net_profit} bold colored />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
