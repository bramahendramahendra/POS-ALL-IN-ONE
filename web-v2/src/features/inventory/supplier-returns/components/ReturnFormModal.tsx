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

const today = new Date().toISOString().slice(0, 10)

const schema = z.object({
  purchase_id: z.number({ error: 'Pilih pembelian' }).positive('Pilih pembelian'),
  return_date: z
    .string()
    .min(1, 'Tanggal wajib diisi')
    .refine((v) => v <= today, 'Tanggal retur tidak boleh lebih dari hari ini'),
  reason: z.string().min(1, 'Alasan wajib diisi'),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const defaultValues: FormValues = {
  purchase_id: 0,
  return_date: today,
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

  const {
    data: purchaseDetailData,
    isLoading: isPurchaseDetailLoading,
  } = useSupplierPurchaseDetailQuery(purchaseId > 0 ? purchaseId : null)
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

  function toggleItem(purchaseItemId: number, maxQty: number) {
    setSelectedItems((prev) => {
      if (prev[purchaseItemId]) {
        const next = { ...prev }
        delete next[purchaseItemId]
        return next
      }
      return { ...prev, [purchaseItemId]: { checked: true, quantity: maxQty } }
    })
  }

  function setItemQty(purchaseItemId: number, qty: number) {
    setSelectedItems((prev) => ({
      ...prev,
      [purchaseItemId]: { ...prev[purchaseItemId], quantity: qty },
    }))
  }

  function onSubmit(values: FormValues) {
    if (!purchaseDetail) return

    const items = purchaseDetail.items
      .filter((item) => !!selectedItems[item.id])
      .map((item) => ({
        purchase_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: selectedItems[item.id].quantity,
        unit: item.unit,
        purchase_price: item.purchase_price,
      }))

    if (items.length === 0) {
      toast.error('Pilih minimal 1 item untuk diretur')
      return
    }

    for (const item of items) {
      const original = purchaseDetail.items.find((i) => i.id === item.purchase_item_id)
      if (!original) continue
      if (item.quantity <= 0) {
        toast.error(`Jumlah retur ${item.product_name} harus lebih dari 0`)
        return
      }
      if (item.quantity > original.quantity) {
        toast.error(`Jumlah retur ${item.product_name} melebihi jumlah pembelian (maks ${original.quantity})`)
        return
      }
    }

    create(
      {
        purchase_id: values.purchase_id,
        supplier_id: purchaseDetail.supplier_id > 0 ? purchaseDetail.supplier_id : undefined,
        supplier_name: purchaseDetail.supplier_name,
        return_date: values.return_date,
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
          <Label htmlFor="ret-date">
            Tanggal Retur <span className="text-red-500">*</span>
          </Label>
          <Input
            id="ret-date"
            type="date"
            max={today}
            {...register('return_date')}
            className={errors.return_date ? 'border-red-500' : ''}
          />
          {errors.return_date && (
            <p className="text-xs text-red-500">{errors.return_date.message}</p>
          )}
        </div>

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

        {isPurchaseDetailLoading && purchaseId > 0 && (
          <div className="space-y-2">
            <Label>Item yang Diretur</Label>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-md bg-gray-100" />
              ))}
            </div>
          </div>
        )}

        {!isPurchaseDetailLoading && purchaseDetail && purchaseDetail.items.length > 0 && (
          <div className="space-y-2">
            <Label>Item yang Diretur</Label>
            <div className="rounded-lg border divide-y text-sm">
              {purchaseDetail.items.map((item) => {
                const sel = selectedItems[item.id]
                return (
                  <div key={item.id} className="flex items-center gap-3 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={!!sel}
                      onChange={() => toggleItem(item.id, item.quantity)}
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
                        onChange={(e) => setItemQty(item.id, Number(e.target.value))}
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
