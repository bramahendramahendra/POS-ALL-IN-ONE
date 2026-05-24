import { useState } from 'react'
import { Search } from 'lucide-react'

import { PageHeader } from '@/shared/components'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useDebounce, usePagination } from '@/shared/hooks'

import { useReceivableListQuery } from './receivables.api'
import type { Receivable, ReceivableFilter, ReceivableStatus } from './receivables.types'
import { PaymentRecordModal } from './components/PaymentRecordModal'
import { ReceivableTable } from './components/ReceivableTable'

export function ReceivablesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ReceivableStatus | 'all'>('all')
  const [payTarget, setPayTarget] = useState<Receivable | null>(null)

  const debouncedSearch = useDebounce(search, 400)
  const { page, pageSize, onPageChange, onPageSizeChange, reset } = usePagination()

  const filter: ReceivableFilter = {
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
    page,
    page_size: pageSize,
  }

  const { data, isLoading } = useReceivableListQuery(filter)
  const receivables = data?.data?.data ?? []
  const total = data?.data?.total ?? 0

  return (
    <div className="space-y-4">
      <PageHeader title="Piutang" breadcrumbs={[{ label: 'Finance' }, { label: 'Piutang' }]} />

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari kode transaksi / pelanggan..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); reset() }}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => { setStatus(v as ReceivableStatus | 'all'); reset() }}
        >
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="unpaid">Belum Lunas</SelectItem>
            <SelectItem value="partial">Sebagian</SelectItem>
            <SelectItem value="paid">Lunas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ReceivableTable
        data={receivables}
        isLoading={isLoading}
        pagination={{ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions: [10, 20, 50] }}
        onPay={(r) => setPayTarget(r)}
      />

      <PaymentRecordModal
        open={!!payTarget}
        onOpenChange={(open) => { if (!open) setPayTarget(null) }}
        receivable={payTarget}
      />
    </div>
  )
}
