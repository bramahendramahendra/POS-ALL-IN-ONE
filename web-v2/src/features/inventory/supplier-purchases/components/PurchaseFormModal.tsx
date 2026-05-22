import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { FormModal } from '@/shared/components'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Button } from '@/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { formatRupiah } from '@/shared/utils'
import { useSupplierListQuery } from '@/features/inventory/suppliers/suppliers.api'
import { useProductListQuery } from '@/features/inventory/products/products.api'

import { useCreateSupplierPurchaseMutation } from '../supplier-purchases.api'
import type { PaymentStatus } from '../supplier-purchases.types'

interface PurchaseFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const itemSchema = z.object({
  product_id: z.number({ invalid_type_error: 'Pilih produk' }).positive('Pilih produk'),
  quantity: z.number({ invalid_type_error: 'Wajib diisi' }).positive('Harus lebih dari 0'),
  price: z.number({ invalid_type_error: 'Wajib diisi' }).nonnegative(),
  unit: z.string().min(1, 'Wajib diisi'),
})

const schema = z.object({
  purchase_date: z.string().min(1, 'Tanggal wajib diisi'),
  invoice_number: z.string().min(1, 'No. faktur wajib diisi'),
  supplier_id: z.number({ invalid_type_error: 'Pilih supplier' }).positive('Pilih supplier'),
  items: z.array(itemSchema).min(1, 'Minimal 1 item'),
  discount_amount: z.number().nonnegative().default(0),
  notes: z.string().optional(),
  payment_status: z.enum(['lunas', 'hutang', 'partial']),
  paid_amount: z.number().nonnegative().default(0),
})

type FormValues = z.infer<typeof schema>

function todayString() {
  return new Date().toISOString().split('T')[0]
}

const defaultValues: FormValues = {
  purchase_date: todayString(),
  invoice_number: '',
  supplier_id: 0,
  items: [{ product_id: 0, quantity: 1, price: 0, unit: '' }],
  discount_amount: 0,
  notes: '',
  payment_status: 'lunas',
  paid_amount: 0,
}

export function PurchaseFormModal({ open, onOpenChange }: PurchaseFormModalProps) {
  const { data: suppliersData } = useSupplierListQuery({ page_size: 200 })
  const { data: productsData } = useProductListQuery({ page_size: 200 })
  const suppliers = suppliersData?.data?.data ?? []
  const products = productsData?.data?.data ?? []

  const { mutate: create, isPending } = useCreateSupplierPurchaseMutation()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const watchItems = watch('items')
  const watchDiscount = watch('discount_amount') ?? 0
  const watchPaymentStatus = watch('payment_status')

  const subtotal = watchItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0)
  const total = Math.max(0, subtotal - (watchDiscount || 0))

  useEffect(() => {
    if (!open) reset({ ...defaultValues, purchase_date: todayString() })
  }, [open, reset])

  function handleProductChange(index: number, productId: string) {
    const id = Number(productId)
    setValue(`items.${index}.product_id`, id)
    const product = products.find((p) => p.id === id)
    if (product) {
      setValue(`items.${index}.unit`, product.base_unit ?? 'pcs')
    }
  }

  function onSubmit(values: FormValues) {
    create(
      {
        ...values,
        items: values.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit,
        })),
        paid_amount: values.payment_status === 'lunas' ? total : values.paid_amount,
      },
      {
        onSuccess: () => {
          toast.success('Pembelian berhasil ditambahkan')
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Tambah Pembelian"
      size="xl"
      isLoading={isPending}
      onSubmit={handleSubmit(onSubmit)}
      submitLabel="Simpan Pembelian"
    >
      <div className="space-y-5">
        {/* Header info */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pur-date">
              Tanggal <span className="text-red-500">*</span>
            </Label>
            <Input id="pur-date" type="date" {...register('purchase_date')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pur-inv">
              No. Faktur <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pur-inv"
              placeholder="INV-001"
              {...register('invoice_number')}
              className={errors.invoice_number ? 'border-red-500' : ''}
            />
            {errors.invoice_number && (
              <p className="text-xs text-red-500">{errors.invoice_number.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>
              Supplier <span className="text-red-500">*</span>
            </Label>
            <Select
              onValueChange={(v) => setValue('supplier_id', Number(v))}
            >
              <SelectTrigger className={errors.supplier_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Pilih supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              Item Produk <span className="text-red-500">*</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ product_id: 0, quantity: 1, price: 0, unit: '' })}
              className="h-7 gap-1 text-xs"
            >
              <Plus className="h-3 w-3" />
              Tambah Item
            </Button>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 w-[35%]">Produk</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 w-[15%]">Satuan</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500 w-[15%]">Qty</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500 w-[20%]">Harga</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500 w-[15%]">Subtotal</th>
                  <th className="px-3 py-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fields.map((field, index) => {
                  const qty = watchItems[index]?.quantity || 0
                  const price = watchItems[index]?.price || 0
                  return (
                    <tr key={field.id}>
                      <td className="px-3 py-2">
                        <Select onValueChange={(v) => handleProductChange(index, v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Pilih produk" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={String(p.id)}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          {...register(`items.${index}.unit`)}
                          placeholder="pcs"
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={1}
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          className="h-8 text-xs text-right"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          {...register(`items.${index}.price`, { valueAsNumber: true })}
                          className="h-8 text-xs text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-medium">
                        {formatRupiah(qty * price)}
                      </td>
                      <td className="px-3 py-2">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals + payment */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pur-discount">Diskon (Rp)</Label>
              <Input
                id="pur-discount"
                type="number"
                min={0}
                placeholder="0"
                {...register('discount_amount', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Status Pembayaran</Label>
              <Select
                defaultValue="lunas"
                onValueChange={(v) => setValue('payment_status', v as PaymentStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lunas">Lunas</SelectItem>
                  <SelectItem value="hutang">Hutang</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {watchPaymentStatus === 'partial' && (
              <div className="space-y-1.5">
                <Label htmlFor="pur-paid">Jumlah Dibayar (Rp)</Label>
                <Input
                  id="pur-paid"
                  type="number"
                  min={0}
                  placeholder="0"
                  {...register('paid_amount', { valueAsNumber: true })}
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-lg bg-gray-50 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Diskon</span>
                <span className="text-red-500">-{formatRupiah(watchDiscount || 0)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold">
                <span>Total</span>
                <span>{formatRupiah(total)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pur-notes">Catatan</Label>
              <Textarea
                id="pur-notes"
                {...register('notes')}
                placeholder="Catatan pembelian (opsional)"
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
    </FormModal>
  )
}
