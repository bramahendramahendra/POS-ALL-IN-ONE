import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { FormModal } from '@/shared/components'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { formatRupiah } from '@/shared/utils'

import { useCloseShiftMutation } from '../shifts.api'
import type { Shift } from '../shifts.types'

interface CloseShiftModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shift: Shift | null
}

const closeShiftSchema = z.object({
  closing_balance: z.number().min(0, 'Uang akhir tidak boleh negatif'),
  notes: z.string().optional(),
})

type CloseShiftForm = z.infer<typeof closeShiftSchema>

export function CloseShiftModal({ open, onOpenChange, shift }: CloseShiftModalProps) {
  const { mutate: closeShift, isPending } = useCloseShiftMutation()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CloseShiftForm>({
    resolver: zodResolver(closeShiftSchema),
    defaultValues: { closing_balance: 0, notes: '' },
  })

  useEffect(() => {
    if (!open) reset({ closing_balance: 0, notes: '' })
  }, [open, reset])

  const closingBalance = watch('closing_balance') || 0
  const expected = (shift?.opening_balance ?? 0) + (shift?.total_revenue ?? 0)
  const selisih = closingBalance - expected

  const onSubmit = (values: CloseShiftForm) => {
    if (!shift) return
    closeShift(
      {
        id: shift.id,
        payload: { closing_balance: values.closing_balance, notes: values.notes || undefined },
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Tutup Shift"
      size="sm"
      isLoading={isPending}
      onSubmit={handleSubmit(onSubmit)}
      submitLabel="Tutup Shift"
    >
      {shift && (
        <div className="space-y-4">
          {/* Ringkasan shift */}
          <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Kasir</span>
              <span className="font-medium">{shift.kasir_name}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total Transaksi</span>
              <span>{shift.total_transactions}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total Pendapatan</span>
              <span className="text-green-600 font-medium">
                {formatRupiah(shift.total_revenue)}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Modal Awal</span>
              <span>{formatRupiah(shift.opening_balance)}</span>
            </div>
            <div className="flex justify-between border-t pt-1.5 font-semibold text-gray-700">
              <span>Ekspektasi Kas</span>
              <span>{formatRupiah(expected)}</span>
            </div>
          </div>

          {/* Closing balance input */}
          <div className="space-y-1.5">
            <Label htmlFor="closing-balance">
              Uang di Laci Akhir Shift <span className="text-red-500">*</span>
            </Label>
            <Input
              id="closing-balance"
              type="number"
              min={0}
              {...register('closing_balance', { valueAsNumber: true })}
              className={errors.closing_balance ? 'border-red-500' : ''}
              placeholder="0"
            />
            {errors.closing_balance && (
              <p className="text-xs text-red-500">{errors.closing_balance.message}</p>
            )}
          </div>

          {/* Selisih */}
          <div
            className={`rounded-lg p-3 text-sm flex justify-between font-semibold ${selisih < 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}
          >
            <span>Selisih</span>
            <span>
              {selisih >= 0 ? '+' : ''}
              {formatRupiah(selisih)}
            </span>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="close-notes">Catatan</Label>
            <Input id="close-notes" {...register('notes')} placeholder="Catatan (opsional)" />
          </div>
        </div>
      )}
    </FormModal>
  )
}
