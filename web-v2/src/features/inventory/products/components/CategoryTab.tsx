import { useState } from 'react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, LockOpen, Pencil, RotateCcw, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { ROLES } from '@/shared/constants'
import { ConfirmDialog, DataTable, FormModal, RoleGuard, StatusBadge } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { useDebounce, useDisclosure, usePagination } from '@/shared/hooks'
import type { ColumnDef } from '@/shared/components/DataTable/DataTable.types'

import {
  useCategoryListQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
  useToggleCategoryStatusMutation,
} from '../products.api'
import type { Category } from '../products.types'

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  description: z.string().optional(),
})
type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoryTabProps {
  openAdd?: boolean
  onOpenAddChange?: (open: boolean) => void
}

export function CategoryTab({ openAdd, onOpenAddChange }: CategoryTabProps) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { isOpen: formOpen, open: openForm, close: closeForm } = useDisclosure()
  const { isOpen: deleteOpen, open: openDelete, close: closeDelete } = useDisclosure()
  const { isOpen: confirmOpen, open: openConfirm, close: closeConfirm } = useDisclosure()
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [pendingValues, setPendingValues] = useState<CategoryFormValues | null>(null)

  const { page, pageSize, onPageChange, onPageSizeChange, reset: resetPage } = usePagination({ initialPageSize: 10 })

  const { data: categories = [], isLoading } = useCategoryListQuery()
  const { mutate: createCategory, isPending: isCreating } = useCreateCategoryMutation()
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategoryMutation()
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategoryMutation()
  const { mutate: toggleStatus } = useToggleCategoryStatusMutation()

  const isPending = isCreating || isUpdating

  useEffect(() => {
    if (openAdd) {
      handleOpenAdd()
      onOpenAddChange?.(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAdd])

  const filtered = debouncedSearch
    ? categories.filter((c) => c.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : categories

  const paginatedCategories = filtered.slice((page - 1) * pageSize, page * pageSize)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema) })

  const handleOpenAdd = () => {
    setEditingCategory(null)
    reset({ name: '', description: '' })
    openForm()
  }

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category)
    reset({ name: category.name, description: category.description ?? '' })
    openForm()
  }

  const handleOpenDelete = (category: Category) => {
    setDeletingCategory(category)
    openDelete()
  }

  const handleCloseForm = () => {
    closeForm()
    setEditingCategory(null)
    reset({ name: '', description: '' })
  }

  const onSubmit = (values: CategoryFormValues) => {
    setPendingValues(values)
    closeForm()
    openConfirm()
  }

  const handleConfirmCancel = () => {
    closeConfirm()
    if (pendingValues) {
      reset(pendingValues)
      openForm()
    }
    setPendingValues(null)
  }

  const handleConfirmSave = () => {
    if (!pendingValues) return
    const values = pendingValues
    if (editingCategory !== null) {
      updateCategory(
        { id: editingCategory.id, name: values.name, description: values.description },
        {
          onSuccess: () => {
            toast.success('Kategori berhasil diperbarui')
            closeConfirm()
            setEditingCategory(null)
            reset({ name: '', description: '' })
          },
        }
      )
    } else {
      createCategory(
        { name: values.name, description: values.description },
        {
          onSuccess: () => {
            toast.success('Kategori berhasil ditambahkan')
            closeConfirm()
            reset({ name: '', description: '' })
          },
        }
      )
    }
  }

  const handleDelete = () => {
    if (deletingCategory === null) return
    deleteCategory(deletingCategory.id, {
      onSuccess: () => {
        toast.success('Kategori berhasil dihapus')
        closeDelete()
        setDeletingCategory(null)
      },
    })
  }

  const handleToggleStatus = (row: Category) => {
    if (row.is_active && row.active_product_count > 0) {
      toast.error(
        `Kategori tidak bisa dinonaktifkan karena masih memiliki ${row.active_product_count} produk aktif`
      )
      return
    }
    toggleStatus(row.id, {
      onSuccess: () =>
        toast.success(`Kategori berhasil ${row.is_active ? 'dinonaktifkan' : 'diaktifkan'}`),
    })
  }

  const columns: ColumnDef<Category>[] = [
    {
      key: 'code',
      header: 'Kode',
      width: '80px',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
          {row.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Nama Kategori',
      cell: (row) => <span className="font-medium text-gray-800">{row.name}</span>,
    },
    {
      key: 'description',
      header: 'Deskripsi',
      cell: (row) =>
        row.description ? (
          <span className="text-sm text-gray-600">{row.description}</span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        ),
    },
    {
      key: 'product_count',
      header: 'Jumlah Produk',
      align: 'center',
      width: '120px',
      cell: (row) => (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
          {row.product_count} produk
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      align: 'center',
      width: '100px',
      cell: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
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
              onClick={() => handleToggleStatus(row)}
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
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2 rounded-lg border bg-white p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari kategori..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage() }}
            className="pl-8 h-9 text-sm"
          />
        </div>
        {search && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSearch(''); resetPage() }}
            className="h-9 gap-1"
          >
            <RotateCcw size={13} />
            Reset
          </Button>
        )}
      </div>

      <DataTable<Category & Record<string, unknown>>
        columns={columns}
        data={paginatedCategories as (Category & Record<string, unknown>)[]}
        pagination={{
          page,
          pageSize,
          total: filtered.length,
          onPageChange,
          onPageSizeChange,
          pageSizeOptions: [10, 20, 50],
        }}
        isLoading={isLoading}
        emptyMessage={debouncedSearch ? 'Kategori tidak ditemukan' : 'Belum ada kategori'}
        emptyDescription={
          debouncedSearch
            ? 'Coba ubah kata kunci pencarian Anda.'
            : 'Tambah kategori pertama Anda untuk memulai.'
        }
      />

      {/* Form Modal */}
      <FormModal
        open={formOpen}
        onOpenChange={(open) => {
          if (!open && pendingValues !== null) return
          if (!open) handleCloseForm()
        }}
        title={editingCategory !== null ? 'Edit Kategori' : 'Tambah Kategori'}
        size="sm"
        isLoading={isPending}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="category-name">
              Nama Kategori <span className="text-red-500">*</span>
            </Label>
            <Input
              id="category-name"
              {...register('name')}
              placeholder="Nama kategori"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category-description">Deskripsi</Label>
            <Textarea
              id="category-description"
              {...register('description')}
              placeholder="Deskripsi kategori (opsional)"
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
      </FormModal>

      {/* Save Confirm */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) handleConfirmCancel()
        }}
        title={editingCategory !== null ? 'Update Kategori' : 'Tambah Kategori'}
        description={`Yakin ingin ${editingCategory !== null ? 'mengupdate' : 'menambahkan'} kategori "${pendingValues?.name}"?`}
        confirmLabel="Ya, Simpan"
        isLoading={isPending}
        onConfirm={handleConfirmSave}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDelete()
            setDeletingCategory(null)
          }
        }}
        title="Hapus Kategori"
        description={`Yakin ingin menghapus kategori "${deletingCategory?.name}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
