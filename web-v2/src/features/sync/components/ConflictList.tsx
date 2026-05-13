import { useState } from 'react'

import { ConfirmDialog } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'

import {
  useApproveConflictMutation,
  useRejectConflictMutation,
  useSyncConflictsQuery,
} from '../sync.api'
import type { SyncConflict } from '../sync.types'

const CONFLICT_TYPE_LABEL: Record<string, string> = {
  product: 'PRODUK',
  transaction: 'TRANSAKSI',
  customer: 'PELANGGAN',
  stock: 'STOK',
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

function DataDiff({
  serverData,
  localData,
}: {
  serverData: Record<string, unknown>
  localData: Record<string, unknown>
}) {
  const allKeys = Array.from(new Set([...Object.keys(serverData), ...Object.keys(localData)]))

  return (
    <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
      <div className="space-y-1">
        <p className="font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Data Server</p>
        {allKeys.map((key) => {
          const isDiff = String(serverData[key]) !== String(localData[key])
          return (
            <div
              key={key}
              className={`flex justify-between px-2 py-1 rounded ${isDiff ? 'bg-yellow-100' : 'bg-gray-50'}`}
            >
              <span className="text-gray-500">{key}</span>
              <span className="font-medium text-gray-800">{String(serverData[key] ?? '—')}</span>
            </div>
          )
        })}
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Data Lokal</p>
        {allKeys.map((key) => {
          const isDiff = String(serverData[key]) !== String(localData[key])
          return (
            <div
              key={key}
              className={`flex justify-between px-2 py-1 rounded ${isDiff ? 'bg-yellow-100' : 'bg-gray-50'}`}
            >
              <span className="text-gray-500">{key}</span>
              <span className="font-medium text-gray-800">{String(localData[key] ?? '—')}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ConflictCard({ conflict }: { conflict: SyncConflict }) {
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const { mutate: approve, isPending: isApproving } = useApproveConflictMutation()
  const { mutate: reject, isPending: isRejecting } = useRejectConflictMutation()

  return (
    <div className="rounded-xl border border-orange-200 bg-white p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>⚠️</span>
          <span className="font-semibold text-gray-800">
            KONFLIK {CONFLICT_TYPE_LABEL[conflict.conflict_type] ?? conflict.conflict_type} —{' '}
            {conflict.entity_name}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Perangkat: <span className="font-medium">{conflict.device_info}</span> ·{' '}
        {formatDateTime(conflict.created_at)}
      </p>

      <DataDiff serverData={conflict.server_data} localData={conflict.local_data} />

      <div className="flex gap-2 justify-end pt-2 border-t">
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => setRejectOpen(true)}
          disabled={isApproving || isRejecting}
        >
          ✗ Tolak
        </Button>
        <Button
          size="sm"
          onClick={() => setApproveOpen(true)}
          disabled={isApproving || isRejecting}
        >
          ✓ Terima Server
        </Button>
      </div>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Terima Data Server"
        description={`Data server akan digunakan untuk "${conflict.entity_name}". Data lokal akan dibuang. Lanjutkan?`}
        confirmLabel="Terima Server"
        isLoading={isApproving}
        onConfirm={() => approve(conflict.id, { onSuccess: () => setApproveOpen(false) })}
      />
      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Tolak Data Server"
        description={`Data lokal akan digunakan untuk "${conflict.entity_name}". Data server akan dibuang. Lanjutkan?`}
        confirmLabel="Pakai Data Lokal"
        variant="destructive"
        isLoading={isRejecting}
        onConfirm={() => reject(conflict.id, { onSuccess: () => setRejectOpen(false) })}
      />
    </div>
  )
}

export function ConflictList() {
  const { data: conflicts, isLoading } = useSyncConflictsQuery()
  const list = conflicts ?? []

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    )
  }

  if (list.length === 0) {
    return (
      <div className="rounded-xl border bg-green-50 border-green-200 py-10 text-center">
        <p className="text-green-700 font-medium">Tidak ada konflik</p>
        <p className="text-sm text-green-600 mt-1">Semua data sudah tersinkronisasi dengan baik</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {list.map((c) => (
        <ConflictCard key={c.id} conflict={c} />
      ))}
    </div>
  )
}
