import { useEffect, useRef, useState } from 'react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { formatRupiah } from '@/shared/utils'

import { useCheckoutMutation } from '../cashier.api'
import { useCashierStore } from '../cashier.store'
import type {
  CartSummary,
  CheckoutResponse,
  Discount,
  PaymentMethod,
  PaymentPayload,
  Tax,
} from '../cashier.types'
import type { CartItem } from '../cashier.types'
import { calcCartSummary, calcChange } from '../cashier.utils'
import { ReceiptPrint } from './ReceiptPrint'

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PaymentFormValues = {
  payment_method: PaymentMethod
  amount_paid: number
}

const PAYMENT_METHODS: { key: PaymentMethod; label: string }[] = [
  { key: 'cash', label: 'Tunai' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'qris', label: 'QRIS' },
  { key: 'card', label: 'Kartu' },
]

function buildRoundedOptions(grandTotal: number): number[] {
  const thresholds = [5_000, 10_000, 25_000, 50_000, 100_000, 500_000]
  const results: number[] = []
  for (const t of thresholds) {
    const rounded = Math.ceil(grandTotal / t) * t
    if (rounded > grandTotal && !results.includes(rounded)) {
      results.push(rounded)
      if (results.length >= 3) break
    }
  }
  return results
}

function buildPayload(
  cart: CartItem[],
  summary: CartSummary,
  discount: Discount,
  tax: Tax,
  customerId: number | undefined,
  paymentMethod: PaymentMethod,
  amountPaid: number,
  notes?: string
): PaymentPayload {
  return {
    customer_id: customerId,
    items: cart.map((i) => ({
      product_id: i.product_id,
      unit_id: i.unit_id,
      qty: i.qty,
      price: i.price,
      subtotal: i.subtotal,
      notes: i.notes,
    })),
    subtotal: summary.subtotal,
    discount_type: discount.type,
    discount_value: discount.value,
    discount_amount: summary.discountAmount,
    tax_percent: tax.percent,
    tax_amount: summary.taxAmount,
    grand_total: summary.grandTotal,
    payment_method: paymentMethod,
    amount_paid: amountPaid,
    change_amount: calcChange(summary.grandTotal, amountPaid),
    notes,
  }
}

export function PaymentModal({ open, onOpenChange }: PaymentModalProps) {
  const amountInputRef = useRef<HTMLInputElement>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<CheckoutResponse | null>(null)
  const [receiptSnapshot, setReceiptSnapshot] = useState<{
    cart: CartItem[]
    summary: CartSummary
    discount: Discount
    tax: Tax
    paymentMethod: PaymentMethod
    amountPaid: number
    customerName?: string
  } | null>(null)

  const { cart, discount, tax, selectedCustomer } = useCashierStore()
  const summary = calcCartSummary(cart, discount, tax)
  const { mutate: checkout, isPending } = useCheckoutMutation()

  const makeSchema = (grandTotal: number) =>
    z
      .object({
        payment_method: z.enum(['cash', 'transfer', 'qris', 'card'] as const),
        amount_paid: z.number().min(0, 'Jumlah bayar wajib diisi'),
      })
      .refine((d) => d.amount_paid >= grandTotal, {
        message: 'Jumlah bayar kurang dari total',
        path: ['amount_paid'],
      })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(makeSchema(summary.grandTotal)),
    defaultValues: { payment_method: 'cash', amount_paid: 0 },
  })

  const paymentMethod = watch('payment_method')
  const amountPaid = watch('amount_paid') ?? 0
  const change = calcChange(summary.grandTotal, amountPaid)
  const sufficient = amountPaid >= summary.grandTotal

  const roundedOptions = buildRoundedOptions(summary.grandTotal)

  // Focus amount input when modal opens
  useEffect(() => {
    if (open) {
      reset({ payment_method: 'cash', amount_paid: 0 })
      setTimeout(() => amountInputRef.current?.focus(), 100)
    }
  }, [open, reset])

  const onSubmit = (values: PaymentFormValues) => {
    const snapshot = {
      cart: [...cart],
      summary: { ...summary },
      discount: { ...discount },
      tax: { ...tax },
      paymentMethod: values.payment_method,
      amountPaid: values.amount_paid,
      customerName: selectedCustomer?.name,
    }

    const payload = buildPayload(
      cart,
      summary,
      discount,
      tax,
      selectedCustomer?.id,
      values.payment_method,
      values.amount_paid
    )

    checkout(payload, {
      onSuccess: (data) => {
        setReceiptSnapshot(snapshot)
        setReceiptData(data as unknown as CheckoutResponse)
        onOpenChange(false)
        setReceiptOpen(true)
      },
    })
  }

  const handleReceiptClose = () => {
    setReceiptOpen(false)
    setReceiptData(null)
    setReceiptSnapshot(null)
  }

  if (!open && !receiptOpen) return null

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-base font-semibold">Pembayaran</h2>
              <button
                onClick={() => !isPending && onOpenChange(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
              {/* Grand total */}
              <div className="rounded-lg bg-gray-50 px-4 py-3 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                  Total Belanja
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatRupiah(summary.grandTotal)}
                </p>
              </div>

              {/* Payment method */}
              <div className="space-y-2">
                <Label className="text-sm">Metode Pembayaran</Label>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setValue('payment_method', key)}
                      className={`rounded-lg border-2 py-2 text-sm font-medium transition-all ${
                        paymentMethod === key
                          ? 'border-[#2c3e50] bg-[#2c3e50] text-white'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount paid */}
              <div className="space-y-1.5">
                <Label htmlFor="amount-paid">Jumlah Bayar</Label>
                <Input
                  id="amount-paid"
                  type="number"
                  min={0}
                  {...register('amount_paid', { valueAsNumber: true })}
                  ref={(el) => {
                    register('amount_paid').ref(el)
                    ;(amountInputRef as React.MutableRefObject<HTMLInputElement | null>).current =
                      el
                  }}
                  className={`text-right text-lg h-11 ${errors.amount_paid ? 'border-red-500' : ''}`}
                  placeholder="0"
                />
                {errors.amount_paid && (
                  <p className="text-xs text-red-500">{errors.amount_paid.message}</p>
                )}
              </div>

              {/* Quick pay buttons */}
              {roundedOptions.length > 0 && (
                <div className="flex gap-2">
                  {roundedOptions.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setValue('amount_paid', amt, { shouldValidate: true })}
                      className="flex-1 rounded-md border border-gray-200 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              )}

              {/* Change */}
              <div
                className={`flex justify-between rounded-lg px-4 py-3 ${
                  sufficient ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <span className={`font-medium ${sufficient ? 'text-green-700' : 'text-red-600'}`}>
                  Kembalian
                </span>
                <span
                  className={`font-bold text-lg ${sufficient ? 'text-green-700' : 'text-red-600'}`}
                >
                  {sufficient ? formatRupiah(change) : `Kurang ${formatRupiah(Math.abs(change))}`}
                </span>
              </div>

              {/* Footer */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => !isPending && onOpenChange(false)}
                  disabled={isPending}
                >
                  Batal
                </Button>
                <Button type="submit" className="flex-1" disabled={!sufficient || isPending}>
                  {isPending ? 'Memproses...' : '✓ Proses Bayar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt */}
      {receiptOpen && receiptData && receiptSnapshot && (
        <ReceiptPrint
          open={receiptOpen}
          onClose={handleReceiptClose}
          checkoutData={receiptData}
          cart={receiptSnapshot.cart}
          summary={receiptSnapshot.summary}
          discount={receiptSnapshot.discount}
          tax={receiptSnapshot.tax}
          paymentMethod={receiptSnapshot.paymentMethod}
          amountPaid={receiptSnapshot.amountPaid}
          customerName={receiptSnapshot.customerName}
        />
      )}
    </>
  )
}
