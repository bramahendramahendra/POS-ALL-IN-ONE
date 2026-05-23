import { useState } from 'react'

import { Input } from '@/shared/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { formatRupiah } from '@/shared/utils'

import { useCashDrawerSummaryQuery } from '../cash-drawer.api'
import type { CashDrawer } from '../cash-drawer.types'

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

function monthStartString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface SummaryCardProps {
  title: string
  value: number
  valueClass?: string
}

function SummaryCard({ title, value, valueClass = '' }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-lg font-semibold ${valueClass}`}>{formatRupiah(value)}</p>
      </CardContent>
    </Card>
  )
}

export function CashDrawerSummaryTab() {
  const [dateFrom, setDateFrom] = useState(monthStartString())
  const [dateTo, setDateTo] = useState(todayString())

  const filter = {
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  }

  const { data, isLoading } = useCashDrawerSummaryQuery(filter)
  const summary = data?.data

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Dari</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Sampai</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {isLoading && (
        <div className="py-8 text-center text-sm text-gray-400">Memuat rekap...</div>
      )}

      {summary && !isLoading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard title="Total Saldo Buka" value={summary.total_opening} />
            <SummaryCard title="Total Saldo Tutup" value={summary.total_closing} />
            <SummaryCard
              title="Total Pengeluaran"
              value={summary.total_expenses}
              valueClass="text-red-600"
            />
            <SummaryCard
              title="Selisih Bersih"
              value={summary.net}
              valueClass={summary.net >= 0 ? 'text-green-600' : 'text-red-600'}
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Tanggal</th>
                  <th className="px-4 py-3 text-right">Saldo Buka</th>
                  <th className="px-4 py-3 text-right">Saldo Tutup</th>
                  <th className="px-4 py-3 text-right">Pengeluaran</th>
                  <th className="px-4 py-3 text-right">Selisih</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.records.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Tidak ada data pada periode ini
                    </td>
                  </tr>
                )}
                {summary.records.map((row: CashDrawer) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{formatDate(row.date)}</td>
                    <td className="px-4 py-3 text-right">{formatRupiah(row.opening_balance)}</td>
                    <td className="px-4 py-3 text-right">
                      {row.status === 'closed' ? formatRupiah(row.closing_balance) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600">
                      {formatRupiah(row.total_out)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        row.difference === 0
                          ? 'text-gray-500'
                          : row.difference > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                      }`}
                    >
                      {row.difference > 0 ? '+' : ''}
                      {formatRupiah(row.difference)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.status === 'closed' ? (
                        <Badge variant="secondary">Tutup</Badge>
                      ) : (
                        <Badge variant="default">Buka</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
