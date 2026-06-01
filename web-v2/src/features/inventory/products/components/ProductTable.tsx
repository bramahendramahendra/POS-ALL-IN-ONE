import { useEffect } from 'react'
import { Eye, Lock, LockOpen, Pencil, Printer, Trash2, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

import { ROLES } from '@/shared/constants'
import { DataTable, RoleGuard, StatusBadge } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { useTableSelection } from '@/shared/hooks'
import { formatRupiah } from '@/shared/utils'
import type { ColumnDef, PaginationProps } from '@/shared/components/DataTable/DataTable.types'

import { useBulkToggleProductStatusMutation, useToggleProductStatusMutation } from '../products.api'
import { useProductsStore } from '../products.store'
import type { Product } from '../products.types'

interface ProductTableProps {
  data: Product[]
  isLoading: boolean
  pagination: PaginationProps
  onSelectionChange?: (products: Product[]) => void
  onPrintLabel?: () => void
  onDetailProduct?: (product: Product) => void
  onPrintSingleLabel?: (product: Product) => void
}


function calcMargin(purchasePrice: number, sellingPrice: number): number {
  if (purchasePrice <= 0 || sellingPrice <= 0) return 0
  return Math.round(((sellingPrice - purchasePrice) / sellingPrice) * 100)
}

export function ProductTable({
  data,
  isLoading,
  pagination,
  onSelectionChange,
  onPrintLabel,
  onDetailProduct,
  onPrintSingleLabel,
}: ProductTableProps) {
  const { openProductModal, openDeleteConfirm } = useProductsStore()
  const { mutate: toggleStatus } = useToggleProductStatusMutation()
  const { mutate: bulkToggleStatus, isPending: isBulkToggling } = useBulkToggleProductStatusMutation()
  const { selectedKeys, toggle, selectAll, clearSelection, hasSelection, count } =
    useTableSelection<Product & { id: number }>()

  // Derive selected products from selectedKeys + current page data
  useEffect(() => {
    const selected = data.filter((p) => selectedKeys.has(p.id))
    onSelectionChange?.(selected)
  }, [selectedKeys, data, onSelectionChange])

  const selectedProducts = data.filter((p) => selectedKeys.has(p.id))
  const allActive = selectedProducts.length > 0 && selectedProducts.every((p) => p.is_active)
  const allInactive = selectedProducts.length > 0 && selectedProducts.every((p) => !p.is_active)
  const showBulkStatus = allActive || allInactive

  function handleExportExcel() {
    const rows = selectedProducts.map((p) => ({
      'Nama Produk': p.name,
      'Barcode': p.barcode ?? '',
      'SKU': p.sku ?? '',
      'Kategori': p.category_name ?? '',
      'Harga Beli': p.purchase_price,
      'Harga Jual': p.selling_price,
      'Stok': p.stock,
      'Stok Minimum': p.min_stock,
      'Satuan': p.unit_name ?? '',
      'Status': p.is_active ? 'Aktif' : 'Nonaktif',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Produk')
    XLSX.writeFile(wb, `produk-export-${Date.now()}.xlsx`)
  }

  function handleBulkToggleStatus() {
    const ids = selectedProducts.map((p) => p.id)
    const label = allActive ? 'dinonaktifkan' : 'diaktifkan'
    bulkToggleStatus(ids, {
      onSuccess: () => {
        toast.success(`${ids.length} produk berhasil ${label}`)
        clearSelection()
      },
    })
  }

  const columns: ColumnDef<Product>[] = [
    {
      key: 'name',
      header: 'Nama Produk',
      sortable: true,
      cell: (row) => <span className="font-medium text-gray-800">{row.name}</span>,
    },
    {
      key: 'barcode',
      header: 'Barcode / SKU',
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          {row.barcode ? (
            <code className="text-xs text-gray-700">{row.barcode}</code>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
          {row.sku ? (
            <span className="text-xs text-gray-500">{row.sku}</span>
          ) : (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </div>
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
      key: 'purchase_price',
      header: 'Harga Beli',
      align: 'right',
      cell: (row) => <span className="text-sm">{formatRupiah(row.purchase_price)}</span>,
    },
    {
      key: 'selling_price',
      header: 'Harga Jual',
      align: 'right',
      cell: (row) => <span className="font-medium">{formatRupiah(row.selling_price)}</span>,
    },
    {
      key: 'margin',
      header: 'Margin',
      align: 'center',
      width: '80px',
      cell: (row) => {
        const m = calcMargin(row.purchase_price, row.selling_price)
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              m >= 30
                ? 'bg-green-100 text-green-700'
                : m >= 15
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-600'
            }`}
          >
            {m}%
          </span>
        )
      },
    },
    {
      key: 'stock',
      header: 'Stok',
      align: 'right',
      width: '80px',
      cell: (row) => (
        <span
          className={`font-medium ${
            row.stock === 0
              ? 'text-red-600'
              : row.stock < row.min_stock
                ? 'text-amber-600'
                : 'text-gray-800'
          }`}
        >
          {row.stock}
        </span>
      ),
    },
    {
      key: 'unit_name',
      header: 'Satuan',
      width: '80px',
      cell: (row) =>
        row.unit_name ? (
          <span className="text-sm text-gray-600">{row.unit_name}</span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        ),
    },
    {
      key: 'is_active',
      header: 'Status',
      align: 'center',
      width: '90px',
      cell: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'center',
      width: '120px',
      cell: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-500 hover:text-blue-600"
            onClick={() => onDetailProduct?.(row)}
            title="Lihat Detail"
          >
            <Eye size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-500 hover:text-indigo-600"
            onClick={() => onPrintSingleLabel?.(row)}
            title="Cetak Label"
          >
            <Printer size={14} />
          </Button>
          <RoleGuard allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-blue-600"
              onClick={() => openProductModal(row.id)}
              title="Edit"
            >
              <Pencil size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${row.is_active ? 'text-gray-500 hover:text-amber-600' : 'text-gray-400 hover:text-green-600'}`}
              onClick={() =>
                toggleStatus(row.id, {
                  onSuccess: () =>
                    toast.success(
                      `Produk berhasil ${row.is_active ? 'dinonaktifkan' : 'diaktifkan'}`
                    ),
                })
              }
              title={row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
            >
              {row.is_active ? <Lock size={14} /> : <LockOpen size={14} />}
            </Button>
          </RoleGuard>
          <RoleGuard allowedRoles={[ROLES.OWNER]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-red-600"
              onClick={() => openDeleteConfirm({ type: 'product', id: row.id, name: row.name })}
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
            {showBulkStatus && (
              <Button
                variant="outline"
                size="sm"
                disabled={isBulkToggling}
                onClick={handleBulkToggleStatus}
                className={allActive ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700'}
              >
                {isBulkToggling ? 'Memproses...' : allActive ? 'Nonaktifkan' : 'Aktifkan'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1">
              <FileDown size={14} />
              Export Excel
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
            if (keys.size === 0) {
              clearSelection()
            } else if (keys.size >= data.length) {
              selectAll(data as (Product & { id: number })[])
            } else {
              const added = [...keys].find((k) => !selectedKeys.has(k))
              const removed = [...selectedKeys].find((k) => !keys.has(k))
              if (added !== undefined) toggle(added)
              else if (removed !== undefined) toggle(removed)
            }
          },
        }}
      />
    </div>
  )
}
