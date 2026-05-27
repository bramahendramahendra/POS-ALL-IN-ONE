import { formatRupiah } from '@/shared/utils'

import type { DashboardStats } from '../dashboard.types'

interface SummaryCardsProps {
  stats: DashboardStats | undefined
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

export function SummaryCards({ stats, isLoading }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatCard
        icon="🧾"
        label="Transaksi Hari Ini"
        value={String(stats?.today.total_transactions ?? 0)}
        isLoading={isLoading}
      />
      <StatCard
        icon="💰"
        label="Pendapatan Hari Ini"
        value={formatRupiah(stats?.today.total_sales ?? 0)}
        isLoading={isLoading}
      />
      <StatCard
        icon="📈"
        label="Laba Kotor Hari Ini"
        value={formatRupiah(stats?.today.gross_profit ?? 0)}
        isLoading={isLoading}
      />
      <StatCard
        icon="📦"
        label="Stok Menipis"
        value={String(stats?.low_stock_count ?? 0)}
        isLoading={isLoading}
      />
      <StatCard
        icon="💳"
        label="Piutang Terbuka"
        value={String(stats?.open_receivables ?? 0)}
        isLoading={isLoading}
      />
    </div>
  )
}
