import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import type { SalesTrendItem } from '../dashboard.types'

interface SalesChartProps {
  data: SalesTrendItem[]
  isLoading: boolean
}

function formatShort(value: number): string {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`
  return `Rp ${value}`
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-white p-3 shadow text-sm space-y-1">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-blue-600">Pendapatan: {formatShort(payload[0]?.value ?? 0)}</p>
      <p className="text-gray-500">Transaksi: {payload[1]?.value ?? 0}</p>
    </div>
  )
}

export function SalesChart({ data, isLoading }: SalesChartProps) {
  if (isLoading) {
    return <div className="h-[300px] animate-pulse rounded-xl bg-gray-100" />
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3498db" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3498db" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatShort} tick={{ fontSize: 11 }} width={70} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total_sales"
          stroke="#3498db"
          fill="url(#revenueGrad)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="total_transactions"
          stroke="#95a5a6"
          fill="transparent"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
