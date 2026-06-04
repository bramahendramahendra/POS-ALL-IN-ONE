import { RotateCcw, Search } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

import type { TransactionFilter } from '../transactions.types'

interface TransactionFilterProps {
  filter: TransactionFilter
  onChange: (filter: TransactionFilter) => void
  onReset: () => void
}

export function TransactionFilterBar({ filter, onChange, onReset }: TransactionFilterProps) {
  const set = (patch: Partial<TransactionFilter>) => onChange({ ...filter, ...patch })

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-3">
      {/* Search */}
      <div className="relative min-w-[200px] flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Kode transaksi / pelanggan..."
          value={filter.search ?? ''}
          onChange={(e) => set({ search: e.target.value || undefined })}
          className="pl-8 h-9 text-sm"
        />
      </div>

      {/* Date range */}
      <Input
        type="date"
        value={filter.start_date ?? ''}
        onChange={(e) => set({ start_date: e.target.value || undefined })}
        className="h-9 w-[150px] text-sm"
      />
      <span className="text-gray-400 text-sm">s/d</span>
      <Input
        type="date"
        value={filter.end_date ?? ''}
        onChange={(e) => set({ end_date: e.target.value || undefined })}
        className="h-9 w-[150px] text-sm"
      />

      {/* Payment method */}
      <Select
        value={filter.payment_method ?? 'all'}
        onValueChange={(v) =>
          set({ payment_method: v === 'all' ? '' : (v as TransactionFilter['payment_method']) })
        }
      >
        <SelectTrigger className="h-9 w-[140px] text-sm">
          <SelectValue placeholder="Semua Metode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Metode</SelectItem>
          <SelectItem value="cash">Tunai</SelectItem>
          <SelectItem value="transfer">Transfer</SelectItem>
          <SelectItem value="qris">QRIS</SelectItem>
          <SelectItem value="card">Kartu</SelectItem>
          <SelectItem value="kredit">Kredit</SelectItem>
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={filter.status ?? 'all'}
        onValueChange={(v) =>
          set({ status: v === 'all' ? '' : (v as TransactionFilter['status']) })
        }
      >
        <SelectTrigger className="h-9 w-[140px] text-sm">
          <SelectValue placeholder="Semua Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="completed">Selesai</SelectItem>
          <SelectItem value="void">Dibatalkan</SelectItem>
        </SelectContent>
      </Select>

      {/* Reset */}
      <Button variant="outline" size="sm" onClick={onReset} className="h-9 gap-1">
        <RotateCcw size={13} />
        Reset
      </Button>
    </div>
  )
}
