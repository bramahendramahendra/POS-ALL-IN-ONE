import { PageHeader, DataTable } from '@/shared/components'
import { Badge } from '@/shared/components/ui/badge'
import { formatRupiah } from '@/shared/utils'
import type { ColumnDef } from '@/shared/components/DataTable/DataTable.types'

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

const columns: ColumnDef<MyCashTransaction>[] = [
  {
    key: 'created_at',
    header: 'Tanggal',
    cell: (row) => <span className="text-gray-600">{formatDateTime(row.created_at)}</span>,
  },
  {
    key: 'type',
    header: 'Jenis',
    width: '120px',
    cell: (row) =>
      row.type === 'receive' ? (
        <Badge variant="default">Terima</Badge>
      ) : (
        <Badge variant="secondary">Kembalikan</Badge>
      ),
  },
  {
    key: 'amount',
    header: 'Jumlah',
    align: 'right',
    width: '140px',
    cell: (row) => (
      <span className={`font-medium ${row.type === 'receive' ? 'text-green-600' : 'text-red-600'}`}>
        {row.type === 'receive' ? '+' : '-'}
        {formatRupiah(row.amount)}
      </span>
    ),
  },
  {
    key: 'notes',
    header: 'Catatan',
    cell: (row) => <span className="text-gray-500">{row.notes ?? '-'}</span>,
  },
  {
    key: 'created_by_name',
    header: 'Oleh',
    cell: (row) => <span className="text-gray-500">{row.created_by_name}</span>,
  },
]

export function MyCashPage() {
  const { data, isLoading } = useMyCashQuery()
  const myCash = data?.data
  const transactions: MyCashTransaction[] = myCash?.transactions ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kas Saya"
        breadcrumbs={[{ label: 'Finance' }, { label: 'Kas Saya' }]}
      />

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

      <div className="space-y-3">
        <h2 className="font-semibold text-gray-700">Riwayat Kas</h2>
        <DataTable<MyCashTransaction & Record<string, unknown>>
          columns={columns}
          data={transactions as (MyCashTransaction & Record<string, unknown>)[]}
          isLoading={isLoading}
          emptyMessage="Belum ada riwayat kas"
        />
      </div>
    </div>
  )
}
