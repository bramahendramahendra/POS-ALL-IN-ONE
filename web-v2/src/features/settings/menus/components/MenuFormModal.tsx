import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { FormModal } from '@/shared/components'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

import { useCreateMenuMutation, useMenuDetailQuery, useUpdateMenuMutation } from '@/features/menu/menu.api'
import type { MenuResponse } from '@/features/menu/menu.types'

const schema = z.object({
  parent_id:   z.number().nullable().optional(),
  key_name:    z.string().min(2, 'Minimal 2 karakter').optional(),
  label:       z.string().min(1, 'Label wajib diisi'),
  icon:        z.string().optional(),
  path:        z.string().optional(),
  order_index: z.number().optional(),
})

type FormValues = z.infer<typeof schema>

const defaultValues: FormValues = {
  parent_id: null,
  key_name: '',
  label: '',
  icon: '',
  path: '',
  order_index: 0,
}

interface MenuFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  menuId?: number
  allMenus: MenuResponse[]
}

export function MenuFormModal({ open, onOpenChange, menuId, allMenus }: MenuFormModalProps) {
  const isEdit = menuId !== undefined

  const { data: detail } = useMenuDetailQuery(isEdit && open ? menuId! : 0)
  const { mutate: create, isPending: isCreating } = useCreateMenuMutation()
  const { mutate: update, isPending: isUpdating } = useUpdateMenuMutation()
  const isPending = isCreating || isUpdating

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<FormValues>({ resolver: zodResolver(schema), defaultValues })

  useEffect(() => { if (!open) reset(defaultValues) }, [open, reset])
  useEffect(() => {
    if (isEdit && detail) {
      reset({
        parent_id:   detail.parent_id,
        label:       detail.label,
        icon:        detail.icon ?? '',
        path:        detail.path ?? '',
        order_index: detail.order_index,
      })
    }
  }, [detail, isEdit, reset])

  const onSubmit = (values: FormValues) => {
    const cb = { onSuccess: () => onOpenChange(false) }
    if (isEdit) {
      update({ id: menuId!, ...values }, cb)
    } else {
      create({ ...values, key_name: values.key_name ?? '' }, cb)
    }
  }

  // Filter: tidak boleh pilih dirinya sendiri sebagai parent
  const parentOptions = allMenus.filter((m) => m.id !== menuId && m.parent_id === null)

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Menu' : 'Tambah Menu'}
      size="sm"
      isLoading={isPending}
      onSubmit={handleSubmit(onSubmit)}
      submitLabel={isEdit ? 'Simpan' : 'Tambah'}
    >
      <div className="space-y-3">
        {!isEdit && (
          <div className="space-y-1.5">
            <Label>Key Name <span className="text-red-500">*</span></Label>
            <Input
              {...register('key_name')}
              placeholder="contoh: inventory.warehouse"
              className={errors.key_name ? 'border-red-500' : ''}
            />
            {errors.key_name && <p className="text-xs text-red-500">{errors.key_name.message}</p>}
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Parent Menu</Label>
          <Select
            value={watch('parent_id')?.toString() ?? 'none'}
            onValueChange={(v) => setValue('parent_id', v === 'none' ? null : Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tidak ada (root)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Tidak ada (root)</SelectItem>
              {parentOptions.map((m) => (
                <SelectItem key={m.id} value={m.id.toString()}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Label <span className="text-red-500">*</span></Label>
          <Input
            {...register('label')}
            placeholder="contoh: Gudang"
            className={errors.label ? 'border-red-500' : ''}
          />
          {errors.label && <p className="text-xs text-red-500">{errors.label.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Icon (Lucide)</Label>
            <Input {...register('icon')} placeholder="contoh: Warehouse" />
          </div>
          <div className="space-y-1.5">
            <Label>Path URL</Label>
            <Input {...register('path')} placeholder="contoh: /warehouse" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Urutan</Label>
          <Input
            type="number"
            {...register('order_index', { valueAsNumber: true })}
          />
        </div>
      </div>
    </FormModal>
  )
}
