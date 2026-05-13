import { formatRupiah } from '@/shared/utils'

import type { DashboardSummary } from '../dashboard.types'

interface SummaryCardsProps {
  summary: DashboardSummary | undefined
  isLoading: boolean
}

interface CardProps {
  icon: string
  label: string
  value: string
  isLoading: boolean
}

function StatCard({ icon, label, value, isLoading }: CardProps) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm space-y-1">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      {isLoading ? (
        <div className="h-7 w-28 animate-pulse rounded bg-gray-100" />
      ) : (
        <p className="text-xl font-bold text-gray-900">{value}</p>
      )}
    </div>
  )
}

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatCard
        icon="🧾"
        label="Transaksi"
        value={String(summary?.total_transactions ?? 0)}
        isLoading={isLoading}
      />
      <StatCard
        icon="💰"
        label="Pendapatan"
        value={formatRupiah(summary?.total_revenue ?? 0)}
        isLoading={isLoading}
      />
      <StatCard
        icon="📦"
        label="Terjual"
        value={`${summary?.total_items_sold ?? 0} item`}
        isLoading={isLoading}
      />
      <StatCard
        icon="👥"
        label="Pelanggan Baru"
        value={String(summary?.new_customers ?? 0)}
        isLoading={isLoading}
      />
      <StatCard
        icon="📊"
        label="Rata-rata"
        value={formatRupiah(summary?.avg_transaction ?? 0)}
        isLoading={isLoading}
      />
    </div>
  )
}
