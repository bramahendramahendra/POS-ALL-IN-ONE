import { useState } from 'react'
import { Clock, Plus } from 'lucide-react'

import { PageHeader } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { usePagination } from '@/shared/hooks'

import { useActiveShiftQuery, useShiftListQuery } from './shifts.api'
import type { Shift, ShiftFilter, ShiftStatus } from './shifts.types'
import { CloseShiftModal } from './components/CloseShiftModal'
import { OpenShiftModal } from './components/OpenShiftModal'
import { ShiftTable } from './components/ShiftTable'

function formatDateTime(str: string): string {
  return new Date(str).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ShiftsPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [status, setStatus] = useState<ShiftStatus | 'all'>('all')
  const [openShiftOpen, setOpenShiftOpen] = useState(false)
  const [closeTarget, setCloseTarget] = useState<Shift | null>(null)

  const { page, pageSize, onPageChange, onPageSizeChange, reset } = usePagination()
  const { data: activeShift } = useActiveShiftQuery()

  const filter: ShiftFilter = {
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    status: status === 'all' ? undefined : status,
    page,
    page_size: pageSize,
  }

  const { data, isLoading } = useShiftListQuery(filter)
  const shifts = data?.data?.data ?? []
  const total = data?.data?.total ?? 0

  return (
    <div className="space-y-4">
      <PageHeader
        title="Manajemen Shift"
        breadcrumbs={[{ label: 'Shifts' }]}
        actions={
          !activeShift ? (
            <Button onClick={() => setOpenShiftOpen(true)} className="gap-1">
              <Plus size={16} />
              Buka Shift
            </Button>
          ) : undefined
        }
      />

      {activeShift && (
        <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <Clock size={16} />
            <span>
              Shift sedang berjalan sejak{' '}
              <span className="font-semibold">{formatDateTime(activeShift.opened_at)}</span> oleh{' '}
              {activeShift.kasir_name}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={() => setCloseTarget(activeShift)}
          >
            Tutup Shift
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-3">
        <div className="space-y-1">
          <span className="text-xs text-gray-500">Dari</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); reset() }}
            className="w-40 h-9"
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs text-gray-500">Sampai</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); reset() }}
            className="w-40 h-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => { setStatus(v as ShiftStatus | 'all'); reset() }}
        >
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="open">Berjalan</SelectItem>
            <SelectItem value="closed">Selesai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ShiftTable
        data={shifts}
        isLoading={isLoading}
        pagination={{ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions: [10, 20, 50] }}
        onClose={(shift) => setCloseTarget(shift)}
      />

      <OpenShiftModal open={openShiftOpen} onOpenChange={setOpenShiftOpen} />
      <CloseShiftModal
        open={!!closeTarget}
        onOpenChange={(open) => { if (!open) setCloseTarget(null) }}
        shift={closeTarget}
      />
    </div>
  )
}
