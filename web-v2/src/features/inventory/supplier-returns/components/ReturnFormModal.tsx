import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { FormModal } from '@/shared/components'
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
import {
  useSupplierPurchasesQuery,
  useSupplierPurchaseDetailQuery,
} from '@/features/inventory/supplier-purchases/supplier-purchases.api'

import { useCreateSupplierReturnMutation } from '../supplier-returns.api'

interface ReturnFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const schema = z.object({
  purchase_id: z.number({ error: 'Pilih pembelian' }).positive('Pilih pembelian'),
  reason: z.string().min(1, 'Alasan wajib diisi'),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const defaultValues: FormValues = {
  purchase_id: 0,
  reason: '',
  notes: '',
}

export function ReturnFormModal({ open, onOpenChange }: ReturnFormModalProps) {
  const [selectedItems, setSelectedItems] = useState<
    Record<number, { checked: boolean; quantity: number }>
  >({})

  const { data: purchasesData } = useSupplierPurchasesQuery({ page_size: 200 })
  const purchases = purchasesData?.items ?? []

  const { mutate: create, isPending } = useCreateSupplierReturnMutation()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues })

  const purchaseId = watch('purchase_id')

  const { data: purchaseDetailData } = useSupplierPurchaseDetailQuery(
    purchaseId > 0 ? purchaseId : null,
  )
  const purchaseDetail = purchaseDetailData

  useEffect(() => {
    if (!open) {
      reset(defaultValues)
      setSelectedItems({})
    }
  }, [open, reset])

  useEffect(() => {
    setSelectedItems({})
  }, [purchaseId])

  function toggleItem(itemId: number, maxQty: number) {
    setSelectedItems((prev) => {
      if (prev[itemId]) {
        const next = { ...prev }
        delete next[itemId]
        return next
      }
      return { ...prev, [itemId]: { checked: true, quantity: maxQty } }
    })
  }

  function setItemQty(itemId: number, qty: number) {
    setSelectedItems((prev) => ({ ...prev, [itemId]: { ...prev[itemId], quantity: qty } }))
  }

  function onSubmit(values: FormValues) {
    const items = Object.entries(selectedItems).map(([id, v]) => ({
      item_id: Number(id),
      quantity: v.quantity,
    }))

    if (items.length === 0) {
      toast.error('Pilih minimal 1 item untuk diretur')
      return
    }

    create(
      {
        purchase_id: values.purchase_id,
        items,
        reason: values.reason,
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Retur berhasil dicatat')
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Tambah Retur Pembelian"
      size="lg"
      isLoading={isPending}
      onSubmit={handleSubmit(onSubmit)}
      submitLabel="Simpan Retur"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>
            Pembelian <span className="text-red-500">*</span>
          </Label>
          <Select onValueChange={(v) => setValue('purchase_id', Number(v))}>
            <SelectTrigger className={errors.purchase_id ? 'border-red-500' : ''}>
              <SelectValue placeholder="Pilih faktur pembelian" />
            </SelectTrigger>
            <SelectContent>
              {purchases.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.invoice_number} — {p.supplier_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.purchase_id && (
            <p className="text-xs text-red-500">{errors.purchase_id.message}</p>
          )}
        </div>

        {purchaseDetail && purchaseDetail.items.length > 0 && (
          <div className="space-y-2">
            <Label>Item yang Diretur</Label>
            <div className="rounded-lg border divide-y text-sm">
              {purchaseDetail.items.map((item, idx) => {
                const sel = selectedItems[item.product_id]
                return (
                  <div key={idx} className="flex items-center gap-3 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={!!sel}
                      onChange={() => toggleItem(item.product_id, item.quantity)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="flex-1">{item.product_name}</span>
                    <span className="text-gray-400 text-xs">{item.unit}</span>
                    {sel && (
                      <Input
                        type="number"
                        min={1}
                        max={item.quantity}
                        value={sel.quantity}
                        onChange={(e) => setItemQty(item.product_id, Number(e.target.value))}
                        className="w-20 h-7 text-xs text-right"
                      />
                    )}
                    {!sel && (
                      <span className="w-20 text-right text-gray-400 text-xs">
                        maks {item.quantity}
                      </span>
                    )}
                    <span className="w-24 text-right font-medium">
                      {formatRupiah(item.purchase_price * (sel?.quantity ?? item.quantity))}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="ret-reason">
            Alasan <span className="text-red-500">*</span>
          </Label>
          <Input
            id="ret-reason"
            placeholder="Alasan retur..."
            {...register('reason')}
            className={errors.reason ? 'border-red-500' : ''}
          />
          {errors.reason && <p className="text-xs text-red-500">{errors.reason.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ret-notes">Catatan</Label>
          <Textarea
            id="ret-notes"
            {...register('notes')}
            placeholder="Catatan tambahan (opsional)"
            className="resize-none"
            rows={2}
          />
        </div>
      </div>
    </FormModal>
  )
}
