import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { FormModal } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { formatRupiah } from '@/shared/utils'

import { usePaySupplierPurchaseMutation } from '../supplier-purchases.api'
import { usePaymentMethodsQuery } from '../payment-methods.api'
import type { SupplierPurchase } from '../supplier-purchases.types'

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: SupplierPurchase | null
}

const paymentSchema = z.object({
  amount:         z.number({ error: 'Jumlah wajib diisi' }).positive('Jumlah harus lebih dari 0'),
  payment_date:   z.string().min(1, 'Tanggal wajib diisi'),
  payment_method: z.string().min(1, 'Metode wajib dipilih'),
  notes:          z.string().optional(),
})

type PaymentFormValues = z.infer<typeof paymentSchema>

function todayString() {
  return new Date().toISOString().split('T')[0]
}

export function PaymentModal({ open, onOpenChange, purchase }: PaymentModalProps) {
  const { mutate: pay, isPending } = usePaySupplierPurchaseMutation(purchase?.id ?? 0)
  const { data: paymentMethods = [] } = usePaymentMethodsQuery()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      payment_date: todayString(),
      payment_method: 'cash',
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        amount: 0,
        payment_date: todayString(),
        payment_method: 'cash',
        notes: '',
      })
    }
  }, [open, reset])

  function handleBayarLunas() {
    if (purchase) setValue('amount', purchase.remaining_amount)
  }

  function onSubmit(values: PaymentFormValues) {
    pay(
      {
        amount:         values.amount,
        payment_date:   values.payment_date,
        payment_method: values.payment_method,
        notes:          values.notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Pembayaran berhasil dicatat')
          onOpenChange(false)
        },
      },
    )
  }

  function handleOpenChange(open: boolean) {
    if (!open) reset()
    onOpenChange(open)
  }

  const amountValue = watch('amount')
  const paymentMethodValue = watch('payment_method')

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
          {/* Info Ringkasan */}
          <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-sm">
            <InfoRow label="Supplier" value={purchase.supplier_name || '—'} />
            <InfoRow label="No. Faktur" value={purchase.invoice_number} />
            <div className="border-t my-1" />
            <InfoRow label="Total Tagihan" value={formatRupiah(purchase.total_amount)} />
            <InfoRow
              label="Sudah Dibayar"
              value={formatRupiah(purchase.paid_amount)}
              valueClass="text-green-600"
            />
            <InfoRow
              label="Sisa Hutang"
              value={formatRupiah(purchase.remaining_amount)}
              valueClass="font-bold text-red-600"
            />
          </div>

          {/* Tanggal Pembayaran */}
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

          {/* Metode Pembayaran */}
          <div className="space-y-1.5">
            <Label>
              Metode Pembayaran <span className="text-red-500">*</span>
            </Label>
            <Select
              value={paymentMethodValue}
              onValueChange={(v) => setValue('payment_method', v)}
            >
              <SelectTrigger className={errors.payment_method ? 'border-red-500' : ''}>
                <SelectValue placeholder="Pilih metode" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem key={m.code} value={m.code}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.payment_method && (
              <p className="text-xs text-red-500">{errors.payment_method.message}</p>
            )}
          </div>

          {/* Jumlah Bayar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="pay-amount">
                Jumlah Bayar (Rp) <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={handleBayarLunas}
              >
                Bayar Lunas
              </Button>
            </div>
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
            {amountValue > 0 && amountValue < purchase.remaining_amount && (
              <p className="text-xs text-yellow-600">
                Sisa setelah bayar: {formatRupiah(purchase.remaining_amount - amountValue)}
              </p>
            )}
          </div>

          {/* Catatan */}
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

function InfoRow({
  label,
  value,
  valueClass = 'font-medium',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  )
}
