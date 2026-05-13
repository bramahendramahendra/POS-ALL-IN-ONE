import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { ROLES } from '@/shared/constants'
import { ConfirmDialog, DataTable, FormModal, RoleGuard } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useDebounce, useDisclosure } from '@/shared/hooks'
import type { ColumnDef } from '@/shared/components/DataTable/DataTable.types'

import {
  useCreateUnitMutation,
  useDeleteUnitMutation,
  useUnitListQuery,
  useUpdateUnitMutation,
} from '../products.api'
import type { Unit } from '../products.types'

const unitSchema = z.object({
  name: z.string().min(1, 'Nama unit wajib diisi'),
})
type UnitFormValues = z.infer<typeof unitSchema>

export function UnitTab() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { isOpen: formOpen, open: openForm, close: closeForm } = useDisclosure()
  const { isOpen: deleteOpen, open: openDelete, close: closeDelete } = useDisclosure()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const { data: units = [], isLoading } = useUnitListQuery()
  const { mutate: createUnit, isPending: isCreating } = useCreateUnitMutation()
  const { mutate: updateUnit, isPending: isUpdating } = useUpdateUnitMutation()
  const { mutate: deleteUnit, isPending: isDeleting } = useDeleteUnitMutation()

  const isPending = isCreating || isUpdating

  const filtered = debouncedSearch
    ? units.filter((u) => u.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : units

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UnitFormValues>({ resolver: zodResolver(unitSchema) })

  const handleOpenAdd = () => {
    setEditingId(null)
    reset({ name: '' })
    openForm()
  }

  const handleOpenEdit = (unit: Unit) => {
    setEditingId(unit.id)
    reset({ name: unit.name })
    openForm()
  }

  const handleOpenDelete = (id: number) => {
    setDeletingId(id)
    openDelete()
  }

  const handleCloseForm = () => {
    closeForm()
    setEditingId(null)
    reset({ name: '' })
  }

  const onSubmit = (values: UnitFormValues) => {
    if (editingId !== null) {
      updateUnit(
        { id: editingId, name: values.name },
        {
          onSuccess: () => {
            toast.success('Unit berhasil diperbarui')
            handleCloseForm()
          },
          onError: (error) => toast.error(error.message),
        }
      )
    } else {
      createUnit(
        { name: values.name },
        {
          onSuccess: () => {
            toast.success('Unit berhasil ditambahkan')
            handleCloseForm()
          },
          onError: (error) => toast.error(error.message),
        }
      )
    }
  }

  const handleDelete = () => {
    if (deletingId === null) return
    deleteUnit(deletingId, {
      onSuccess: () => {
        toast.success('Unit berhasil dihapus')
        closeDelete()
        setDeletingId(null)
      },
      onError: (error) => toast.error(error.message),
    })
  }

  const columns: ColumnDef<Unit>[] = [
    {
      key: 'name',
      header: 'Nama Unit',
      sortable: true,
      cell: (row) => <span className="font-medium text-gray-800">{row.name}</span>,
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
            onClick={() => handleOpenEdit(row)}
            title="Edit"
          >
            <Pencil size={14} />
          </Button>
          <RoleGuard allowedRoles={[ROLES.OWNER]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-red-600"
              onClick={() => handleOpenDelete(row.id)}
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
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <RoleGuard allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
          <Button onClick={handleOpenAdd} className="gap-1" size="sm">
            <Plus size={14} />
            Tambah Unit
          </Button>
        </RoleGuard>
      </div>

      <DataTable<Unit & Record<string, unknown>>
        columns={columns}
        data={filtered as (Unit & Record<string, unknown>)[]}
        isLoading={isLoading}
        emptyMessage="Belum ada unit"
        emptyDescription="Tambah unit pertama Anda untuk memulai."
      />

      {/* Form Modal */}
      <FormModal
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseForm()
        }}
        title={editingId !== null ? 'Edit Unit' : 'Tambah Unit'}
        size="sm"
        isLoading={isPending}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="space-y-1.5">
          <Label htmlFor="unit-name">
            Nama Unit <span className="text-red-500">*</span>
          </Label>
          <Input
            id="unit-name"
            {...register('name')}
            placeholder="Nama unit (contoh: Pcs, Lusin, Kardus)"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>
      </FormModal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDelete()
            setDeletingId(null)
          }
        }}
        title="Hapus Unit"
        description="Unit yang dihapus tidak bisa dikembalikan. Yakin ingin melanjutkan?"
        confirmLabel="Ya, Hapus"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
