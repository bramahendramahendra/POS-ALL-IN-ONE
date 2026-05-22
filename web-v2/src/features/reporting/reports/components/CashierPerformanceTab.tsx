import { useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { formatRupiah } from '@/shared/utils'

import { useCashierPerformanceQuery } from '../reports.api'
import type { CashierPerformance } from '../reports.types'

function monthStart() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function CashierPerformanceTab() {
  const [dateFrom, setDateFrom] = useState(monthStart())
  const [dateTo, setDateTo] = useState(todayStr())

  const { data, isLoading } = useCashierPerformanceQuery({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  })

  const items: CashierPerformance[] = (data?.data ?? []).slice().sort(
    (a, b) => b.total_sales - a.total_sales,
  )

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

      {/* Table */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400 rounded-lg border border-dashed">
          Belum ada data kinerja kasir untuk periode yang dipilih
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Nama Kasir</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Jml Transaksi</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Total Penjualan</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Rata-rata/Transaksi</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Void</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <tr key={item.user_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium">{item.cashier_name}</td>
                  <td className="px-4 py-3 text-right">{item.total_transactions}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                    {formatRupiah(item.total_sales)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {formatRupiah(item.avg_per_transaction)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.void_count > 0 ? (
                      <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                        {item.void_count}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
