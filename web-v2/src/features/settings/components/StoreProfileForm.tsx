import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

import { useStoreProfileQuery, useUpdateStoreProfileMutation } from '../settings.api'

const storeSchema = z.object({
  name: z.string().min(1, 'Nama toko wajib diisi'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  tax_default: z.number().min(0).max(100).optional(),
})

type StoreForm = z.infer<typeof storeSchema>

export function StoreProfileForm() {
  const { data: profile, isLoading } = useStoreProfileQuery()
  const { mutate: updateProfile, isPending } = useUpdateStoreProfileMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StoreForm>({
    resolver: zodResolver(storeSchema),
    defaultValues: { name: '', address: '', phone: '', email: '', tax_default: 0 },
  })

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        address: profile.address ?? '',
        phone: profile.phone ?? '',
        email: profile.email ?? '',
        tax_default: profile.tax_default ?? 0,
      })
    }
  }, [profile, reset])

  const onSubmit = (values: StoreForm) => {
    updateProfile({
      name: values.name,
      address: values.address || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
      tax_default: values.tax_default,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div className="space-y-1.5">
        <Label htmlFor="store-name">
          Nama Toko <span className="text-red-500">*</span>
        </Label>
        <Input
          id="store-name"
          {...register('name')}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="store-address">Alamat</Label>
        <Input id="store-address" {...register('address')} placeholder="Alamat toko (opsional)" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="store-phone">Nomor Telepon</Label>
        <Input id="store-phone" {...register('phone')} placeholder="08xx..." />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="store-email">Email</Label>
        <Input
          id="store-email"
          type="email"
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
          placeholder="toko@email.com"
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="store-tax">Pajak Default Kasir (%)</Label>
        <Input
          id="store-tax"
          type="number"
          min={0}
          max={100}
          {...register('tax_default', { valueAsNumber: true })}
          className={errors.tax_default ? 'border-red-500' : ''}
          placeholder="0"
        />
        {errors.tax_default && <p className="text-xs text-red-500">{errors.tax_default.message}</p>}
        <p className="text-xs text-gray-400">Dipakai sebagai nilai awal pajak di halaman kasir</p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
      </Button>
    </form>
  )
}
