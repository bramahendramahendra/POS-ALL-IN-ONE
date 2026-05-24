import { useState } from 'react'

import { PageHeader } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { usePagination } from '@/shared/hooks'

import { useCashflowQuery, useFinanceSummaryQuery } from './finance.api'
import type { FinanceFilter } from './finance.types'
import { FinanceSummaryCard } from './components/FinanceSummaryCard'
import { FinanceTable } from './components/FinanceTable'

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

function weekStartString(): string {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay() + 1)
  return d.toISOString().split('T')[0]
}

function monthStartString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function FinancePage() {
  const today = todayString()

  const [dateFrom, setDateFrom] = useState(monthStartString())
  const [dateTo, setDateTo] = useState(today)

  const { page, pageSize, onPageChange, onPageSizeChange, reset } = usePagination()

  const filter: FinanceFilter = {
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    page_size: pageSize,
  }

  const { data: summaryData, isLoading: summaryLoading } = useFinanceSummaryQuery({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  })
  const { data: cashflowData, isLoading: cashflowLoading } = useCashflowQuery(filter)

  const cashflows = cashflowData?.data?.data ?? []
  const total = cashflowData?.data?.total ?? 0

  const applyPreset = (from: string, to: string) => {
    setDateFrom(from)
    setDateTo(to)
    reset()
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Keuangan" breadcrumbs={[{ label: 'Finance' }, { label: 'Keuangan' }]} />

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Dari</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); reset() }}
            className="w-40 h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Sampai</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); reset() }}
            className="w-40 h-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => applyPreset(today, today)}>
            Hari ini
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset(weekStartString(), today)}>
            Minggu ini
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset(monthStartString(), today)}>
            Bulan ini
          </Button>
        </div>
      </div>

      <FinanceSummaryCard summary={summaryData} isLoading={summaryLoading} />

      <div className="space-y-3">
        <h2 className="font-semibold text-gray-700">Arus Kas</h2>
        <FinanceTable
          data={cashflows}
          isLoading={cashflowLoading}
          pagination={{ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions: [10, 20, 50] }}
        />
      </div>
    </div>
  )
}
