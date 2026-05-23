import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { FormModal } from '@/shared/components'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { formatRupiah } from '@/shared/utils'

import { usePaySupplierPurchaseMutation } from '../supplier-purchases.api'
import type { SupplierPurchase } from '../supplier-purchases.types'

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: SupplierPurchase | null
}

const paymentSchema = z.object({
  amount: z.number({ error: 'Jumlah wajib diisi' }).positive('Jumlah harus lebih dari 0'),
  notes: z.string().optional(),
})

type PaymentFormValues = z.infer<typeof paymentSchema>

export function PaymentModal({ open, onOpenChange, purchase }: PaymentModalProps) {
  const { mutate: pay, isPending } = usePaySupplierPurchaseMutation(purchase?.id ?? 0)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0, notes: '' },
  })

  function onSubmit(values: PaymentFormValues) {
    pay(
      { amount: values.amount, notes: values.notes || undefined },
      {
        onSuccess: () => {
          toast.success('Pembayaran berhasil dicatat')
          reset()
          onOpenChange(false)
        },
      },
    )
  }

  function handleOpenChange(open: boolean) {
    if (!open) reset()
    onOpenChange(open)
  }

  return (
    <FormModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Catat Pembayaran"
      size="sm"
      isLoading={isPending}
      onSubmit={handleSubmit(onSubmit)}
      submitLabel="Simpan Pembayaran"
    >
      {purchase && (
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Faktur</span>
              <span className="font-medium">{purchase.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Sisa Hutang</span>
              <span className="font-semibold text-red-600">
                {formatRupiah(purchase.remaining_amount)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">
              Jumlah Bayar (Rp) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pay-amount"
              type="number"
              min={1}
              max={purchase.remaining_amount}
              placeholder="0"
              {...register('amount', { valueAsNumber: true })}
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-notes">Catatan</Label>
            <Textarea
              id="pay-notes"
              {...register('notes')}
              placeholder="Catatan pembayaran (opsional)"
              className="resize-none"
              rows={2}
            />
          </div>
        </div>
      )}
    </FormModal>
  )
}
