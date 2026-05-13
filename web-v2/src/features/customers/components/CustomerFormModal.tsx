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
  useCreateCustomerMutation,
  useCustomerDetailQuery,
  useUpdateCustomerMutation,
} from '../customers.api'
import type { Customer } from '../customers.types'

const customerSchema = z.object({
  name: z.string().min(1, 'Nama pelanggan wajib diisi'),
  phone: z.string().optional(),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type CustomerFormValues = z.infer<typeof customerSchema>

const defaultValues: CustomerFormValues = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
}

function mapToForm(c: Customer): CustomerFormValues {
  return {
    name: c.name,
    phone: c.phone ?? '',
    email: c.email ?? '',
    address: c.address ?? '',
    notes: c.notes ?? '',
  }
}

interface CustomerFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId?: number
}

export function CustomerFormModal({ open, onOpenChange, customerId }: CustomerFormModalProps) {
  const isEdit = customerId !== undefined

  const { data: detail, isLoading: isLoadingDetail } = useCustomerDetailQuery(
    isEdit && open ? (customerId as number) : 0
  )
  const { mutate: create, isPending: isCreating } = useCreateCustomerMutation()
  const { mutate: update, isPending: isUpdating } = useUpdateCustomerMutation()
  const isPending = isCreating || isUpdating

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  })

  useEffect(() => {
    if (isEdit && detail) reset(mapToForm(detail))
  }, [detail, isEdit, reset])

  useEffect(() => {
    if (!open) reset(defaultValues)
  }, [open, reset])

  const onSubmit = (values: CustomerFormValues) => {
    const payload = {
      name: values.name,
      phone: values.phone || undefined,
      email: values.email || undefined,
      address: values.address || undefined,
      notes: values.notes || undefined,
    }
    if (isEdit) {
      update(
        { id: customerId as number, ...payload },
        {
          onSuccess: () => {
            toast.success('Pelanggan berhasil diperbarui')
            onOpenChange(false)
          },
          onError: (e) => toast.error(e.message),
        }
      )
    } else {
      create(payload, {
        onSuccess: () => {
          toast.success('Pelanggan berhasil ditambahkan')
          onOpenChange(false)
        },
        onError: (e) => toast.error(e.message),
      })
    }
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
      size="md"
      isLoading={isPending}
      onSubmit={handleSubmit(onSubmit)}
    >
      {isEdit && isLoadingDetail ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cust-name">
              Nama Pelanggan <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cust-name"
              {...register('name')}
              placeholder="Nama pelanggan"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cust-phone">Telepon</Label>
              <Input id="cust-phone" {...register('phone')} placeholder="08xx-xxxx-xxxx" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-email">Email</Label>
              <Input
                id="cust-email"
                type="email"
                {...register('email')}
                placeholder="email@contoh.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cust-address">Alamat</Label>
            <Textarea
              id="cust-address"
              {...register('address')}
              placeholder="Alamat lengkap"
              className="resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cust-notes">Catatan</Label>
            <Textarea
              id="cust-notes"
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
