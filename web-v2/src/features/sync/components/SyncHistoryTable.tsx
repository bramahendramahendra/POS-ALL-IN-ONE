import { useState } from 'react'

import { DataTable } from '@/shared/components'
import type { ColumnDef, PaginationProps } from '@/shared/components/DataTable/DataTable.types'

import { useSyncHistoryQuery } from '../sync.api'
import type { SyncHistoryItem } from '../sync.types'

const STATUS_STYLE: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  success: 'Sukses',
  partial: 'Sebagian',
  error: 'Error',
}

function formatDateTime(str: string): string {
  return new Date(str).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const PAGE_SIZE = 10

export function SyncHistoryTable() {
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data, isLoading } = useSyncHistoryQuery({ page, page_size: PAGE_SIZE })
  const rows = data?.data?.data ?? []
  const total = data?.data?.total ?? 0

  const pagination: PaginationProps = { page, pageSize: PAGE_SIZE, total, onPageChange: setPage }

  const columns: ColumnDef<SyncHistoryItem>[] = [
    {
      key: 'created_at',
      header: 'Waktu Sync',
      cell: (row) => (
        <span className="text-sm text-gray-600">{formatDateTime(row.created_at)}</span>
      ),
    },
    {
      key: 'device_info',
      header: 'Perangkat',
      cell: (row) => <span className="font-medium text-sm">{row.device_info}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      cell: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[row.status] ?? ''}`}
        >
          {STATUS_LABEL[row.status] ?? row.status}
        </span>
      ),
    },
    {
      key: 'synced_count',
      header: 'Tersync',
      align: 'right',
      cell: (row) => <span className="text-green-600 font-medium">{row.synced_count}</span>,
    },
    {
      key: 'error_count',
      header: 'Error',
      align: 'right',
      cell: (row) => (
        <span className={row.error_count > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
          {row.error_count}
        </span>
      ),
    },
    {
      key: 'message',
      header: 'Pesan',
      cell: (row) =>
        row.message ? (
          <div>
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
            >
              {expandedId === row.id ? 'Sembunyikan' : 'Lihat pesan'}
            </button>
            {expandedId === row.id && (
              <p className="mt-1 text-xs text-gray-600 bg-gray-50 rounded p-2 max-w-xs">
                {row.message}
              </p>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
  ]

  return (
    <DataTable<SyncHistoryItem & Record<string, unknown>>
      columns={columns}
      data={rows as (SyncHistoryItem & Record<string, unknown>)[]}
      isLoading={isLoading}
      emptyMessage="Belum ada riwayat sinkronisasi"
      emptyDescription="Riwayat akan muncul setelah perangkat melakukan sinkronisasi."
      pagination={pagination}
    />
  )
}
