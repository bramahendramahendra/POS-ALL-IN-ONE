import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { FormModal } from '@/shared/components'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

import { useOpenShiftMutation } from '../shifts.api'

interface OpenShiftModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const openShiftSchema = z.object({
  opening_balance: z.number().min(0, 'Modal awal tidak boleh negatif'),
  notes: z.string().optional(),
})

type OpenShiftForm = z.infer<typeof openShiftSchema>

export function OpenShiftModal({ open, onOpenChange }: OpenShiftModalProps) {
  const { mutate: openShift, isPending } = useOpenShiftMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OpenShiftForm>({
    resolver: zodResolver(openShiftSchema),
    defaultValues: { opening_balance: 0, notes: '' },
  })

  useEffect(() => {
    if (!open) reset({ opening_balance: 0, notes: '' })
  }, [open, reset])

  const onSubmit = (values: OpenShiftForm) => {
    openShift(
      { opening_balance: values.opening_balance, notes: values.notes || undefined },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Buka Shift Baru"
      size="sm"
      isLoading={isPending}
      onSubmit={handleSubmit(onSubmit)}
      submitLabel="Buka Shift"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="opening-balance">
            Modal Awal (uang di laci kasir) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="opening-balance"
            type="number"
            min={0}
            {...register('opening_balance', { valueAsNumber: true })}
            className={errors.opening_balance ? 'border-red-500' : ''}
            placeholder="0"
          />
          {errors.opening_balance && (
            <p className="text-xs text-red-500">{errors.opening_balance.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="open-notes">Catatan</Label>
          <Input id="open-notes" {...register('notes')} placeholder="Catatan (opsional)" />
        </div>
      </div>
    </FormModal>
  )
}
