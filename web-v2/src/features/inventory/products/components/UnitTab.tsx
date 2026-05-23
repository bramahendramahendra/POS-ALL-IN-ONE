import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, LockOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react'
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
  useToggleUnitStatusMutation,
  useUnitListQuery,
  useUpdateUnitMutation,
} from '../products.api'
import type { Unit } from '../products.types'

const unitSchema = z.object({
  name: z.string().min(1, 'Nama unit wajib diisi'),
  abbreviation: z.string().min(1, 'Singkatan wajib diisi'),
})
type UnitFormValues = z.infer<typeof unitSchema>

export function UnitTab() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { isOpen: formOpen, open: openForm, close: closeForm } = useDisclosure()
  const { isOpen: deleteOpen, open: openDelete, close: closeDelete } = useDisclosure()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null)

  const { data: units = [], isLoading } = useUnitListQuery()
  const { mutate: createUnit, isPending: isCreating } = useCreateUnitMutation()
  const { mutate: updateUnit, isPending: isUpdating } = useUpdateUnitMutation()
  const { mutate: deleteUnit, isPending: isDeleting } = useDeleteUnitMutation()
  const { mutate: toggleStatus } = useToggleUnitStatusMutation()

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
    reset({ name: '', abbreviation: '' })
    openForm()
  }

  const handleOpenEdit = (unit: Unit) => {
    setEditingId(unit.id)
    reset({ name: unit.name, abbreviation: unit.abbreviation })
    openForm()
  }

  const handleOpenDelete = (unit: Unit) => {
    setDeletingUnit(unit)
    openDelete()
  }

  const handleCloseForm = () => {
    closeForm()
    setEditingId(null)
    reset({ name: '', abbreviation: '' })
  }

  const onSubmit = (values: UnitFormValues) => {
    if (editingId !== null) {
      updateUnit(
        { id: editingId, name: values.name, abbreviation: values.abbreviation },
        {
          onSuccess: () => {
            toast.success('Unit berhasil diperbarui')
            handleCloseForm()
          },
        }
      )
    } else {
      createUnit(
        { name: values.name, abbreviation: values.abbreviation },
        {
          onSuccess: () => {
            toast.success('Unit berhasil ditambahkan')
            handleCloseForm()
          },
        }
      )
    }
  }

  const handleDelete = () => {
    if (deletingUnit === null) return
    deleteUnit(deletingUnit.id, {
      onSuccess: () => {
        toast.success('Unit berhasil dihapus')
        closeDelete()
        setDeletingUnit(null)
      },
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
      key: 'abbreviation',
      header: 'Singkatan',
      width: '100px',
      cell: (row) => <code className="text-sm">{row.abbreviation}</code>,
    },
    {
      key: 'is_active',
      header: 'Status',
      align: 'center',
      width: '100px',
      cell: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            row.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-600'
          }`}
        >
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'center',
      width: '120px',
      cell: (row) => (
        <div className="flex items-center justify-center gap-1">
          <RoleGuard allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-blue-600"
              onClick={() => handleOpenEdit(row)}
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
                    toast.success(`Unit berhasil ${row.is_active ? 'dinonaktifkan' : 'diaktifkan'}`),
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
              onClick={() => handleOpenDelete(row)}
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
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="unit-name">
              Nama Unit <span className="text-red-500">*</span>
            </Label>
            <Input
              id="unit-name"
              {...register('name')}
              placeholder="Nama unit (contoh: Pieces, Lusin, Kardus)"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit-abbreviation">
              Singkatan <span className="text-red-500">*</span>
            </Label>
            <Input
              id="unit-abbreviation"
              {...register('abbreviation')}
              placeholder="Singkatan (contoh: Pcs, Lsn, Kds)"
              className={errors.abbreviation ? 'border-red-500' : ''}
            />
            {errors.abbreviation && (
              <p className="text-xs text-red-500">{errors.abbreviation.message}</p>
            )}
          </div>
        </div>
      </FormModal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDelete()
            setDeletingUnit(null)
          }
        }}
        title="Hapus Unit"
        description={`Yakin ingin menghapus unit "${deletingUnit?.name}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
