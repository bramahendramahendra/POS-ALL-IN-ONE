import { Eye, Pencil, Power, Trash2 } from 'lucide-react'

import { ROLES } from '@/shared/constants'
import { DataTable, RoleGuard } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import type { ColumnDef, PaginationProps } from '@/shared/components/DataTable/DataTable.types'

import type { Supplier } from '../suppliers.types'

interface SupplierTableProps {
  data: Supplier[]
  isLoading: boolean
  pagination: PaginationProps
  onDetail: (id: number) => void
  onEdit: (supplier: Supplier) => void
  onDelete: (id: number) => void
  onToggleStatus: (id: number) => void
}

export function SupplierTable({
  data,
  isLoading,
  pagination,
  onDetail,
  onEdit,
  onDelete,
  onToggleStatus,
}: SupplierTableProps) {
  const columns: ColumnDef<Supplier>[] = [
    {
      key: 'supplier_code',
      header: 'Kode Supplier',
      cell: (row) => <span className="font-mono text-sm text-gray-600">{row.supplier_code}</span>,
    },
    {
      key: 'name',
      header: 'Nama Supplier',
      sortable: true,
      cell: (row) => <span className="font-medium text-gray-800">{row.name}</span>,
    },
    {
      key: 'contact_person',
      header: 'Nama Kontak',
      cell: (row) =>
        row.contact_person ? (
          <span>{row.contact_person}</span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        ),
    },
    {
      key: 'phone',
      header: 'Telepon',
      cell: (row) =>
        row.phone ? (
          <span className="font-mono text-sm">{row.phone}</span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        ),
    },
    {
      key: 'email',
      header: 'Email',
      cell: (row) =>
        row.email ? (
          <span className="text-sm">{row.email}</span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        ),
    },
    {
      key: 'is_active',
      header: 'Status',
      align: 'center',
      width: '90px',
      cell: (row) =>
        row.is_active ? (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 text-xs">
            Aktif
          </Badge>
        ) : (
          <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-500 text-xs">
            Nonaktif
          </Badge>
        ),
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
            className="h-7 w-7 text-gray-500 hover:text-indigo-600"
            onClick={() => onDetail(row.id)}
            title="Detail"
          >
            <Eye size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-500 hover:text-blue-600"
            onClick={() => onEdit(row)}
            title="Edit"
          >
            <Pencil size={14} />
          </Button>
          <RoleGuard allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${row.is_active ? 'text-gray-500 hover:text-amber-600' : 'text-gray-400 hover:text-green-600'}`}
              onClick={() => onToggleStatus(row.id)}
              title={row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
            >
              <Power size={14} />
            </Button>
          </RoleGuard>
          <RoleGuard allowedRoles={[ROLES.OWNER]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-red-600"
              onClick={() => onDelete(row.id)}
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
    <DataTable<Supplier & Record<string, unknown>>
      columns={columns}
      data={data as (Supplier & Record<string, unknown>)[]}
      isLoading={isLoading}
      emptyMessage="Belum ada supplier"
      emptyDescription="Tambah supplier pertama Anda untuk memulai."
      pagination={pagination}
    />
  )
}
