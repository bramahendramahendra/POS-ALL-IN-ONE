import { Pencil, Trash2 } from 'lucide-react'

import { ROLES } from '@/shared/constants'
import { DataTable, RoleGuard } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import type { ColumnDef, PaginationProps } from '@/shared/components/DataTable/DataTable.types'

import type { Customer } from '../customers.types'

interface CustomerTableProps {
  data: Customer[]
  isLoading: boolean
  pagination: PaginationProps
  onEdit: (customer: Customer) => void
  onDelete: (id: number) => void
}

export function CustomerTable({
  data,
  isLoading,
  pagination,
  onEdit,
  onDelete,
}: CustomerTableProps) {
  const columns: ColumnDef<Customer>[] = [
    {
      key: 'name',
      header: 'Nama Pelanggan',
      sortable: true,
      cell: (row) => <span className="font-medium text-gray-800">{row.name}</span>,
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
            onClick={() => onEdit(row)}
            title="Edit"
          >
            <Pencil size={14} />
          </Button>
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
    <DataTable<Customer & Record<string, unknown>>
      columns={columns}
      data={data as (Customer & Record<string, unknown>)[]}
      isLoading={isLoading}
      emptyMessage="Belum ada pelanggan"
      emptyDescription="Tambah pelanggan pertama Anda untuk memulai."
      pagination={pagination}
    />
  )
}
