import { useState } from 'react'
import { Search } from 'lucide-react'

import { DataTable } from '@/shared/components'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { formatRupiah } from '@/shared/utils'
import { useDebounce, usePagination } from '@/shared/hooks'
import type { ColumnDef } from '@/shared/components/DataTable/DataTable.types'

import { useStockReportQuery } from '../reports.api'
import type { StockReport, StockReportFilter } from '../reports.types'

export function StockReportTab() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const debouncedSearch = useDebounce(search, 300)
  const { page, pageSize, onPageChange, onPageSizeChange } = usePagination()

  // Get categories from products API categories endpoint
  const categories: { id: number; name: string }[] = []

  const filter: StockReportFilter = {
    search: debouncedSearch || undefined,
    category_id: categoryId,
    page,
    page_size: pageSize,
  }

  const { data, isLoading } = useStockReportQuery(filter)
  const items: StockReport[] = data?.data?.items ?? []
  const total = data?.data?.total ?? 0
  const totalStockValue = data?.data?.total_stock_value ?? 0

  const columns: ColumnDef<StockReport>[] = [
    {
      key: 'product_code',
      header: 'Kode',
      cell: (r) => <span className="text-xs font-mono text-gray-500">{r.product_code}</span>,
    },
    {
      key: 'product_name',
      header: 'Nama Produk',
      cell: (r) => <span className="text-sm font-medium">{r.product_name}</span>,
    },
    {
      key: 'category_name',
      header: 'Kategori',
      cell: (r) => <span className="text-sm text-gray-500">{r.category_name}</span>,
    },
    {
      key: 'unit',
      header: 'Satuan',
      cell: (r) => <span className="text-sm">{r.unit}</span>,
    },
    {
      key: 'current_stock',
      header: 'Stok Saat Ini',
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end gap-2">
          <span className={`text-sm font-semibold ${r.current_stock < r.min_stock ? 'text-red-600' : ''}`}>
            {r.current_stock}
          </span>
          {r.current_stock < r.min_stock && (
            <span className="inline-flex rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
              Stok Rendah
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'stock_value',
      header: 'Nilai Stok',
      align: 'right',
      cell: (r) => <span className="text-sm font-medium">{formatRupiah(r.stock_value)}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 w-52"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Kategori</label>
          <Select
            value={categoryId ? String(categoryId) : 'all'}
            onValueChange={(v) => setCategoryId(v === 'all' ? undefined : Number(v))}
          >
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 max-w-sm">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Total Item Produk</p>
          <p className="text-xl font-bold text-gray-800">{total}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Total Nilai Stok</p>
          <p className="text-xl font-bold text-gray-800">{formatRupiah(totalStockValue)}</p>
        </div>
      </div>

      <DataTable<StockReport & Record<string, unknown>>
        columns={columns}
        data={items as (StockReport & Record<string, unknown>)[]}
        isLoading={isLoading}
        emptyMessage="Belum ada data stok"
        emptyDescription="Data stok produk akan muncul sesuai filter yang dipilih."
        pagination={{ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions: [10, 25, 50] }}
      />
    </div>
  )
}
