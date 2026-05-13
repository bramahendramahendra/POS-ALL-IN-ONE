import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { FormModal } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { formatRupiah } from '@/shared/utils'

import { useAddPaymentMutation } from '../receivables.api'
import type { Receivable } from '../receivables.types'

interface PaymentRecordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receivable: Receivable | null
}

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function PaymentRecordModal({ open, onOpenChange, receivable }: PaymentRecordModalProps) {
  const remaining = receivable?.remaining_amount ?? 0
  const receivableId = receivable?.id ?? 0

  const paymentSchema = z.object({
    amount: z
      .number()
      .min(1, 'Jumlah bayar wajib diisi')
      .max(remaining, `Maksimal pembayaran ${formatRupiah(remaining)}`),
    payment_date: z.string().min(1, 'Tanggal wajib diisi'),
    notes: z.string().optional(),
  })

  type PaymentFormValues = z.infer<typeof paymentSchema>

  const { mutate: addPayment, isPending } = useAddPaymentMutation(receivableId)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0, payment_date: todayString(), notes: '' },
  })

  useEffect(() => {
    if (!open) reset({ amount: 0, payment_date: todayString(), notes: '' })
  }, [open, reset])

  const onSubmit = (values: PaymentFormValues) => {
    addPayment(
      {
        amount: values.amount,
        payment_date: values.payment_date,
        notes: values.notes || undefined,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Catat Pembayaran Piutang"
      size="sm"
      isLoading={isPending}
      onSubmit={handleSubmit(onSubmit)}
      submitLabel="Simpan Pembayaran"
    >
      {receivable && (
        <div className="space-y-4">
          {/* Summary info */}
          <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Pelanggan</span>
              <span className="font-medium">{receivable.customer_name}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total Piutang</span>
              <span>{formatRupiah(receivable.total_amount)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Sudah Dibayar</span>
              <span className="text-green-600">{formatRupiah(receivable.paid_amount)}</span>
            </div>
            <div className="flex justify-between border-t pt-1.5 font-semibold">
              <span>Sisa</span>
              <span className="text-red-600">{formatRupiah(remaining)}</span>
            </div>
          </div>

          {/* Amount + bayar lunas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="pay-amount">
                Jumlah Bayar <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setValue('amount', remaining, { shouldValidate: true })}
              >
                Bayar Lunas
              </Button>
            </div>
            <Input
              id="pay-amount"
              type="number"
              min={1}
              max={remaining}
              {...register('amount', { valueAsNumber: true })}
              className={errors.amount ? 'border-red-500' : ''}
              placeholder="0"
            />
            {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="pay-date">
              Tanggal Pembayaran <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pay-date"
              type="date"
              {...register('payment_date')}
              className={errors.payment_date ? 'border-red-500' : ''}
            />
            {errors.payment_date && (
              <p className="text-xs text-red-500">{errors.payment_date.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="pay-notes">Catatan</Label>
            <Input id="pay-notes" {...register('notes')} placeholder="Catatan (opsional)" />
          </div>
        </div>
      )}
    </FormModal>
  )
}
