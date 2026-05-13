import { formatRupiah } from '@/shared/utils'

import type { FinanceSummary } from '../finance.types'

interface FinanceSummaryCardProps {
  summary: FinanceSummary | undefined
  isLoading: boolean
}

interface CardProps {
  icon: string
  label: string
  value: number
  isLoading: boolean
  valueClass?: string
}

function SummaryCard({ icon, label, value, isLoading, valueClass = 'text-gray-900' }: CardProps) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm space-y-1">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      {isLoading ? (
        <div className="h-7 w-32 animate-pulse rounded bg-gray-100" />
      ) : (
        <p className={`text-xl font-bold ${valueClass}`}>{formatRupiah(value)}</p>
      )}
    </div>
  )
}

export function FinanceSummaryCard({ summary, isLoading }: FinanceSummaryCardProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <SummaryCard
        icon="💰"
        label="Pemasukan"
        value={summary?.total_income ?? 0}
        isLoading={isLoading}
        valueClass="text-green-600"
      />
      <SummaryCard
        icon="💸"
        label="Pengeluaran"
        value={summary?.total_expense ?? 0}
        isLoading={isLoading}
        valueClass="text-red-600"
      />
      <SummaryCard
        icon="📈"
        label="Laba"
        value={summary?.net_profit ?? 0}
        isLoading={isLoading}
        valueClass={(summary?.net_profit ?? 0) >= 0 ? 'text-blue-600' : 'text-red-600'}
      />
      <SummaryCard
        icon="📋"
        label="Piutang"
        value={summary?.total_receivable ?? 0}
        isLoading={isLoading}
        valueClass="text-orange-600"
      />
    </div>
  )
}
