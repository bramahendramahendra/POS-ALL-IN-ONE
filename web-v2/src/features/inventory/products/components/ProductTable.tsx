import { useEffect } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

import { ROLES } from '@/shared/constants'
import { DataTable, RoleGuard, StatusBadge } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { useTableSelection } from '@/shared/hooks'
import { formatRupiah } from '@/shared/utils'
import type { ColumnDef, PaginationProps } from '@/shared/components/DataTable/DataTable.types'

import { useProductsStore } from '../products.store'
import type { Product } from '../products.types'

interface ProductTableProps {
  data: Product[]
  isLoading: boolean
  pagination: PaginationProps
  onSelectionChange?: (products: Product[]) => void
  onPrintLabel?: () => void
  onImportCsv?: () => void
}

function getDefaultPrice(product: Product): number | null {
  const defaultUnit = product.units.find((u) => u.is_default)
  if (!defaultUnit) return null
  const tiers = product.prices
    .filter((p) => p.unit_id === defaultUnit.unit_id)
    .sort((a, b) => a.min_qty - b.min_qty)
  return tiers[0]?.price ?? null
}

export function ProductTable({
  data,
  isLoading,
  pagination,
  onSelectionChange,
  onPrintLabel,
  onImportCsv,
}: ProductTableProps) {
  const { openProductModal, openDeleteConfirm } = useProductsStore()
  const { selectedKeys, selectedItems, toggle, selectAll, clearSelection, hasSelection, count } =
    useTableSelection<Product & { id: number }>()

  // Notify parent when selection changes
  useEffect(() => {
    onSelectionChange?.(selectedItems as Product[])
  }, [selectedItems, onSelectionChange])

  const columns: ColumnDef<Product>[] = [
    {
      key: 'name',
      header: 'Nama Produk',
      sortable: true,
      cell: (row) => <span className="font-medium text-gray-800">{row.name}</span>,
    },
    {
      key: 'sku',
      header: 'SKU',
      cell: (row) =>
        row.sku ? (
          <span className="font-mono text-sm">{row.sku}</span>
        ) : (
          <span className="text-gray-400 text-sm italic">—</span>
        ),
    },
    {
      key: 'category_name',
      header: 'Kategori',
      cell: (row) =>
        row.category_name ? (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
            {row.category_name}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        ),
    },
    {
      key: 'is_active',
      header: 'Status',
      align: 'center',
      cell: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
    },
    {
      key: 'price',
      header: 'Harga Default',
      align: 'right',
      cell: (row) => {
        const price = getDefaultPrice(row)
        return price !== null ? (
          <span className="font-medium">{formatRupiah(price)}</span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'center',
      width: '100px',
      cell: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-500 hover:text-blue-600"
            onClick={() => openProductModal(row.id)}
            title="Edit"
          >
            <Pencil size={14} />
          </Button>
          <RoleGuard allowedRoles={[ROLES.OWNER]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-red-600"
              onClick={() => openDeleteConfirm({ type: 'product', id: row.id })}
              title="Hapus"
            >
              <Trash2 size={14} />
            </Button>
          </RoleGuard>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-2">
      {/* Bulk action bar */}
      {hasSelection && (
        <div className="flex items-center gap-3 rounded-lg border bg-blue-50 px-4 py-2 text-sm">
          <span className="font-medium text-blue-700">{count} produk dipilih</span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={onImportCsv}>
              Import CSV
            </Button>
            <Button variant="outline" size="sm" onClick={onPrintLabel}>
              Cetak Label
            </Button>
            <Button variant="outline" size="sm" onClick={() => clearSelection()}>
              Batalkan Pilihan
            </Button>
          </div>
        </div>
      )}

      <DataTable<Product & Record<string, unknown>>
        columns={columns}
        data={data as (Product & Record<string, unknown>)[]}
        isLoading={isLoading}
        emptyMessage="Belum ada produk"
        emptyDescription="Tambah produk pertama Anda untuk memulai."
        pagination={pagination}
        rowSelection={{
          enabled: true,
          rowKey: 'id',
          selectedKeys,
          onSelectionChange: (keys) => {
            const added = [...keys].find((k) => !selectedKeys.has(k))
            const removed = [...selectedKeys].find((k) => !keys.has(k))
            if (added !== undefined) toggle(added)
            else if (removed !== undefined) toggle(removed)
            else if (keys.size === 0) clearSelection()
            else selectAll(data as (Product & { id: number })[])
          },
        }}
      />
    </div>
  )
}
