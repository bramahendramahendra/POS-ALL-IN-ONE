import { formatRupiah } from '@/shared/utils'

import type { TopProductItem } from '../dashboard.types'

interface TopProductsTableProps {
  data: TopProductItem[]
  isLoading: boolean
}

export function TopProductsTable({ data, isLoading }: TopProductsTableProps) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold text-gray-700 text-sm">Top Produk Terlaris</h3>
      </div>
      {isLoading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-400">Belum ada data</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 text-center w-8">#</th>
              <th className="px-3 py-2 text-left">Produk</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((p, i) => (
              <tr key={p.product_id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-400 font-mono">{i + 1}</td>
                <td className="px-3 py-2">
                  <span className="font-medium text-gray-800">{p.product_name}</span>
                </td>
                <td className="px-3 py-2 text-right text-gray-600">{p.total_qty}</td>
                <td className="px-3 py-2 text-right font-semibold text-blue-600">
                  {formatRupiah(p.total_value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
