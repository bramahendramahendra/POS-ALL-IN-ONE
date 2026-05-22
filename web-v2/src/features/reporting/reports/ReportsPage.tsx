import { useState } from 'react'

import { PageHeader } from '@/shared/components'

import { SalesReportTab } from './components/SalesReportTab'
import { ProfitLossTab } from './components/ProfitLossTab'
import { StockReportTab } from './components/StockReportTab'
import { CashierPerformanceTab } from './components/CashierPerformanceTab'

type TabKey = 'sales' | 'profit-loss' | 'stock' | 'cashier'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'sales', label: 'Penjualan' },
  { key: 'profit-loss', label: 'Laba Rugi' },
  { key: 'stock', label: 'Stok' },
  { key: 'cashier', label: 'Kinerja Kasir' },
]

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('sales')

  return (
    <div className="space-y-4">
      <PageHeader title="Laporan" breadcrumbs={[{ label: 'Reporting' }, { label: 'Laporan' }]} />

      {/* Tab bar */}
      <div className="border-b bg-white">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'sales' && <SalesReportTab />}
        {activeTab === 'profit-loss' && <ProfitLossTab />}
        {activeTab === 'stock' && <StockReportTab />}
        {activeTab === 'cashier' && <CashierPerformanceTab />}
      </div>
    </div>
  )
}
