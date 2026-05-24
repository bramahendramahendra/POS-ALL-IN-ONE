import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { FormModal } from '@/shared/components'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'

import {
  useCreateSupplierMutation,
  useSupplierDetailQuery,
  useUpdateSupplierMutation,
} from '../suppliers.api'
import type { Supplier } from '../suppliers.types'

const supplierSchema = z.object({
  name: z.string().min(1, 'Nama supplier wajib diisi'),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type SupplierFormValues = z.infer<typeof supplierSchema>

interface SupplierFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierId?: number
}

function mapSupplierToForm(supplier: Supplier): SupplierFormValues {
  return {
    name: supplier.name,
    contact_person: supplier.contact_person ?? '',
    phone: supplier.phone ?? '',
    email: supplier.email ?? '',
    address: supplier.address ?? '',
    notes: supplier.notes ?? '',
  }
}

const defaultValues: SupplierFormValues = {
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
}

export function SupplierFormModal({ open, onOpenChange, supplierId }: SupplierFormModalProps) {
  const isEdit = supplierId !== undefined

  const { data: detailData, isLoading: isLoadingDetail } = useSupplierDetailQuery(
    isEdit && open ? (supplierId as number) : 0
  )

  const { mutate: createSupplier, isPending: isCreating } = useCreateSupplierMutation()
  const { mutate: updateSupplier, isPending: isUpdating } = useUpdateSupplierMutation()
  const isPending = isCreating || isUpdating

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues,
  })

  useEffect(() => {
    if (isEdit && detailData) {
      reset(mapSupplierToForm(detailData))
    }
  }, [detailData, isEdit, reset])

  useEffect(() => {
    if (!open) reset(defaultValues)
  }, [open, reset])

  const onSubmit = (values: SupplierFormValues) => {
    const payload = {
      name: values.name,
      contact_person: values.contact_person || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
      address: values.address || undefined,
      notes: values.notes || undefined,
    }

    if (isEdit) {
      updateSupplier(
        { id: supplierId as number, ...payload },
        {
          onSuccess: () => {
            toast.success('Supplier berhasil diperbarui')
            onOpenChange(false)
          },
          onError: (e) => toast.error(e.message),
        }
      )
    } else {
      createSupplier(payload, {
        onSuccess: () => {
          toast.success('Supplier berhasil ditambahkan')
          onOpenChange(false)
        },
        onError: (e) => toast.error(e.message),
      })
    }
  }

  const isLoadingContent = isEdit && isLoadingDetail

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Supplier' : 'Tambah Supplier'}
      size="md"
      isLoading={isPending}
      onSubmit={handleSubmit(onSubmit)}
    >
      {isLoadingContent ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Nama */}
          <div className="space-y-1.5">
            <Label htmlFor="sup-name">
              Nama Supplier <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sup-name"
              {...register('name')}
              placeholder="Nama supplier"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Kontak + Telepon */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sup-contact">Nama Kontak</Label>
              <Input id="sup-contact" {...register('contact_person')} placeholder="Nama kontak" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-phone">No. Telepon</Label>
              <Input id="sup-phone" {...register('phone')} placeholder="08xx-xxxx-xxxx" />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="sup-email">Email</Label>
            <Input
              id="sup-email"
              type="email"
              {...register('email')}
              placeholder="email@supplier.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Alamat */}
          <div className="space-y-1.5">
            <Label htmlFor="sup-address">Alamat</Label>
            <Textarea
              id="sup-address"
              {...register('address')}
              placeholder="Alamat lengkap supplier"
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Catatan */}
          <div className="space-y-1.5">
            <Label htmlFor="sup-notes">Catatan</Label>
            <Textarea
              id="sup-notes"
              {...register('notes')}
              placeholder="Catatan tambahan (opsional)"
              className="resize-none"
              rows={2}
            />
          </div>
        </div>
      )}
    </FormModal>
  )
}
