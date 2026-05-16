import { useState } from 'react'

import { PageHeader } from '@/shared/components'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useDebounce } from '@/shared/hooks'

import { useReceivableListQuery } from './receivables.api'
import type { Receivable, ReceivableFilter, ReceivableStatus } from './receivables.types'
import { PaymentRecordModal } from './components/PaymentRecordModal'
import { ReceivableTable } from './components/ReceivableTable'

const PAGE_SIZE = 10

export function ReceivablesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ReceivableStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [payTarget, setPayTarget] = useState<Receivable | null>(null)

  const debouncedSearch = useDebounce(search, 400)

  const filter: ReceivableFilter = {
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
    page,
    page_size: PAGE_SIZE,
  }

  const { data, isLoading } = useReceivableListQuery(filter)
  const receivables = data?.data?.data ?? []
  const total = data?.data?.total ?? 0

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Piutang" breadcrumbs={[{ label: 'Finance' }, { label: 'Piutang' }]} />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Cari kode transaksi / pelanggan..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as ReceivableStatus | 'all')
            setPage(1)
          }}
        >
          <SelectTrigger className="w-44">
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
        pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }}
        onPay={(r) => setPayTarget(r)}
      />

      <PaymentRecordModal
        open={!!payTarget}
        onOpenChange={(open) => {
          if (!open) setPayTarget(null)
        }}
        receivable={payTarget}
      />
    </div>
  )
}
