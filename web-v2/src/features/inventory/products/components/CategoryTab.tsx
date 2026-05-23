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
  useCategoryListQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from '../products.api'
import type { Category } from '../products.types'

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
})
type CategoryFormValues = z.infer<typeof categorySchema>

export function CategoryTab() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { isOpen: formOpen, open: openForm, close: closeForm } = useDisclosure()
  const { isOpen: deleteOpen, open: openDelete, close: closeDelete } = useDisclosure()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  const { data: categories = [], isLoading } = useCategoryListQuery()
  const { mutate: createCategory, isPending: isCreating } = useCreateCategoryMutation()
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategoryMutation()
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategoryMutation()

  const isPending = isCreating || isUpdating

  const filtered = debouncedSearch
    ? categories.filter((c) => c.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : categories

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema) })

  const handleOpenAdd = () => {
    setEditingId(null)
    reset({ name: '' })
    openForm()
  }

  const handleOpenEdit = (category: Category) => {
    setEditingId(category.id)
    reset({ name: category.name })
    openForm()
  }

  const handleOpenDelete = (category: Category) => {
    setDeletingCategory(category)
    openDelete()
  }

  const handleCloseForm = () => {
    closeForm()
    setEditingId(null)
    reset({ name: '' })
  }

  const onSubmit = (values: CategoryFormValues) => {
    if (editingId !== null) {
      updateCategory(
        { id: editingId, name: values.name },
        {
          onSuccess: () => {
            toast.success('Kategori berhasil diperbarui')
            handleCloseForm()
          },
          onError: (error) => toast.error(error.message),
        }
      )
    } else {
      createCategory(
        { name: values.name },
        {
          onSuccess: () => {
            toast.success('Kategori berhasil ditambahkan')
            handleCloseForm()
          },
          onError: (error) => toast.error(error.message),
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
      onError: (error) => toast.error(error.message),
    })
  }

  const columns: ColumnDef<Category>[] = [
    {
      key: 'name',
      header: 'Nama Kategori',
      cell: (row) => <span className="font-medium text-gray-800">{row.name}</span>,
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'center',
      width: '100px',
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
            placeholder="Cari kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <RoleGuard allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
          <Button onClick={handleOpenAdd} className="gap-1" size="sm">
            <Plus size={14} />
            Tambah Kategori
          </Button>
        </RoleGuard>
      </div>

      <DataTable<Category & Record<string, unknown>>
        columns={columns}
        data={filtered as (Category & Record<string, unknown>)[]}
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
          if (!open) handleCloseForm()
        }}
        title={editingId !== null ? 'Edit Kategori' : 'Tambah Kategori'}
        size="sm"
        isLoading={isPending}
        onSubmit={handleSubmit(onSubmit)}
      >
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
      </FormModal>

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
