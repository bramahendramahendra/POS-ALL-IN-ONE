import { useEffect } from 'react'
import { useForm, type UseFormRegister } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { FormModal } from '@/shared/components'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'

import { useCreateRoleMutation, useRoleDetailQuery, useUpdateRoleMutation } from '../roles.api'
import type { Role } from '../roles.types'

const createSchema = z.object({
  name:         z.string().min(2, 'Minimal 2 karakter').regex(/^[a-z0-9_]+$/, 'Hanya huruf kecil, angka, dan underscore'),
  display_name: z.string().min(1, 'Label wajib diisi'),
  description:  z.string().optional(),
})

const editSchema = z.object({
  display_name: z.string().min(1, 'Label wajib diisi'),
  description:  z.string().optional(),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

interface RoleFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roleId?: number
}

function mapToEditForm(role: Role): EditForm {
  return { display_name: role.display_name, description: role.description ?? '' }
}

const createDefaults: CreateForm = { name: '', display_name: '', description: '' }
const editDefaults: EditForm = { display_name: '', description: '' }

export function RoleFormModal({ open, onOpenChange, roleId }: RoleFormModalProps) {
  const isEdit = roleId !== undefined

  const { data: detail } = useRoleDetailQuery(isEdit && open ? roleId! : 0)
  const { mutate: create, isPending: isCreating } = useCreateRoleMutation()
  const { mutate: update, isPending: isUpdating } = useUpdateRoleMutation()
  const isPending = isCreating || isUpdating

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema), defaultValues: createDefaults })
  const editForm   = useForm<EditForm>({ resolver: zodResolver(editSchema), defaultValues: editDefaults })

  const activeForm = isEdit ? editForm : createForm
  const { handleSubmit, reset, formState: { errors } } = activeForm
  const register = activeForm.register as UseFormRegister<{ display_name: string; description?: string }>

  useEffect(() => { if (!open) reset(isEdit ? editDefaults : createDefaults) }, [open, reset, isEdit])
  useEffect(() => { if (isEdit && detail) reset(mapToEditForm(detail)) }, [detail, isEdit, reset])

  const onSubmit = (values: CreateForm | EditForm) => {
    const cb = { onSuccess: () => onOpenChange(false) }
    if (isEdit) {
      update({ id: roleId!, ...(values as EditForm) }, cb)
    } else {
      create(values as CreateForm, cb)
    }
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Role' : 'Tambah Role'}
      size="sm"
      isLoading={isPending}
      onSubmit={handleSubmit(onSubmit)}
      submitLabel={isEdit ? 'Simpan' : 'Tambah'}
    >
      <div className="space-y-3">
        {!isEdit && (
          <div className="space-y-1.5">
            <Label>Nama Role (slug) <span className="text-red-500">*</span></Label>
            <Input
              {...(createForm.register('name'))}
              placeholder="contoh: supervisor"
              className={'name' in errors && errors.name ? 'border-red-500' : ''}
            />
            {'name' in errors && errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
            <p className="text-xs text-gray-400">Hanya huruf kecil, angka, dan underscore. Tidak bisa diubah setelah dibuat.</p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Label Tampil <span className="text-red-500">*</span></Label>
          <Input
            {...register('display_name')}
            placeholder="contoh: Supervisor Gudang"
            className={errors.display_name ? 'border-red-500' : ''}
          />
          {errors.display_name && (
            <p className="text-xs text-red-500">{errors.display_name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Deskripsi</Label>
          <Textarea
            {...register('description')}
            placeholder="Deskripsi role ini..."
            rows={3}
          />
        </div>
      </div>
    </FormModal>
  )
}
