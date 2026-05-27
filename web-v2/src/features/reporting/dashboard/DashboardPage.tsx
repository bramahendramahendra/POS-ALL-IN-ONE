import { useState } from 'react'

import { PageHeader } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'

import { useDashboardStatsQuery, useSalesTrendQuery, useTopProductsQuery } from './dashboard.api'
import type { DashboardPeriod } from './dashboard.types'
import { SalesChart } from './components/SalesChart'
import { SummaryCards } from './components/SummaryCards'
import { TopProductsTable } from './components/TopProductsTable'

const PERIODS: { label: string; value: DashboardPeriod }[] = [
  { label: 'Hari Ini', value: 'today' },
  { label: 'Minggu Ini', value: 'week' },
  { label: 'Bulan Ini', value: 'month' },
]

export function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('today')

  const { data: statsData, isLoading: statsLoading } = useDashboardStatsQuery(period)
  const { data: trendData, isLoading: trendLoading } = useSalesTrendQuery(period)
  const { data: topData, isLoading: topLoading } = useTopProductsQuery(period)

  const trendPoints = trendData ?? []
  const topProducts = topData ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Dashboard" />
        <div className="flex gap-1 rounded-lg border p-1 bg-gray-50">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant={period === p.value ? 'default' : 'ghost'}
              className="h-7 text-xs"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <SummaryCards stats={statsData} isLoading={statsLoading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border bg-white p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm">Grafik Penjualan</h3>
          <SalesChart data={trendPoints} isLoading={trendLoading} />
        </div>
        <div className="lg:col-span-1">
          <TopProductsTable data={topProducts} isLoading={topLoading} />
        </div>
      </div>
    </div>
  )
}
