import { PageHeader } from '@/shared/components'
import { Badge } from '@/shared/components/ui/badge'
import { formatRupiah } from '@/shared/utils'

import { useMyCashQuery } from './my-cash.api'
import type { MyCashTransaction } from './my-cash.types'

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MyCashPage() {
  const { data, isLoading } = useMyCashQuery()
  const myCash = data?.data
  const transactions: MyCashTransaction[] = myCash?.transactions ?? []

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Kas Saya"
        breadcrumbs={[{ label: 'Finance' }, { label: 'Kas Saya' }]}
      />

      {/* Balance card */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500 mb-1">Saldo Kas Saat Ini</p>
        {isLoading ? (
          <div className="h-10 w-40 animate-pulse rounded bg-gray-100" />
        ) : (
          <p className="text-4xl font-bold text-gray-900">
            {formatRupiah(myCash?.balance ?? 0)}
          </p>
        )}
      </div>

      {/* Transaction history */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-700">Riwayat Kas</h2>

        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        )}

        {!isLoading && transactions.length === 0 && (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-gray-400">
            Belum ada riwayat kas
          </div>
        )}

        {!isLoading && transactions.length > 0 && (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Tanggal</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Jenis</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Jumlah</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Catatan</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600">{formatDateTime(tx.created_at)}</td>
                    <td className="px-4 py-3">
                      {tx.type === 'receive' ? (
                        <Badge variant="default">Terima</Badge>
                      ) : (
                        <Badge variant="secondary">Kembalikan</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <span
                        className={
                          tx.type === 'receive' ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {tx.type === 'receive' ? '+' : '-'}
                        {formatRupiah(tx.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{tx.notes ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{tx.created_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
