import { useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

import type { ExportFormat, GroupBy, ReportFilter, ReportType } from '../reports.types'

interface ReportFilterProps {
  onApply: (filter: ReportFilter) => void
  onExport: (format: ExportFormat) => void
  isExporting: boolean
}

function monthStart(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

const REPORT_TYPES: { label: string; value: ReportType }[] = [
  { label: 'Penjualan', value: 'sales' },
  { label: 'Produk', value: 'products' },
  { label: 'Kasir', value: 'cashiers' },
]

export function ReportFilter({ onApply, onExport, isExporting }: ReportFilterProps) {
  const [type, setType] = useState<ReportType>('sales')
  const [dateFrom, setDateFrom] = useState(monthStart())
  const [dateTo, setDateTo] = useState(today())
  const [groupBy, setGroupBy] = useState<GroupBy>('day')

  const handleApply = () => {
    onApply({
      type,
      date_from: dateFrom,
      date_to: dateTo,
      group_by: type === 'sales' ? groupBy : undefined,
      page: 1,
    })
  }

  return (
    <div className="rounded-xl border bg-white p-4 space-y-4">
      {/* Type toggle */}
      <div className="flex gap-1 rounded-lg border p-1 bg-gray-50 w-fit">
        {REPORT_TYPES.map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant={type === t.value ? 'default' : 'ghost'}
            className="h-7 text-xs"
            onClick={() => setType(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Date + group_by row */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Dari</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Sampai</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
        {type === 'sales' && (
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Kelompokkan</Label>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Harian</SelectItem>
                <SelectItem value="week">Mingguan</SelectItem>
                <SelectItem value="month">Bulanan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={handleApply} size="sm">
          Tampilkan
        </Button>

        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={() => onExport('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={() => onExport('excel')}
          >
            Export Excel
          </Button>
        </div>
      </div>
    </div>
  )
}
