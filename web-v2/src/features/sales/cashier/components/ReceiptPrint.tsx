import { Printer, ShoppingCart } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { formatRupiah } from '@/shared/utils'

import type {
  CartItem,
  CartSummary,
  CheckoutResponse,
  Discount,
  PaymentMethod,
  Tax,
} from '../cashier.types'

interface ReceiptPrintProps {
  open: boolean
  onClose: () => void
  checkoutData: CheckoutResponse
  cart: CartItem[]
  summary: CartSummary
  discount: Discount
  tax: Tax
  paymentMethod: PaymentMethod
  amountPaid: number
  customerName?: string
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tunai',
  transfer: 'Transfer',
  qris: 'QRIS',
  card: 'Kartu',
  kredit: 'Kredit',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ReceiptPrint({
  open,
  onClose,
  checkoutData,
  cart,
  summary,
  discount,
  tax,
  paymentMethod,
  amountPaid,
  customerName,
}: ReceiptPrintProps) {
  if (!open) return null

  const change = amountPaid - summary.grandTotal

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <style>{`
        @media print {
          body > *:not(.receipt-root) { display: none !important; }
          .receipt-root { position: fixed; inset: 0; background: white; }
          .no-print { display: none !important; }
          .receipt-content { font-family: monospace; font-size: 12px; }
        }
      `}</style>

      <div className="receipt-root bg-white rounded-lg shadow-2xl w-full max-w-sm mx-4 flex flex-col max-h-[90vh]">
        {/* Action buttons */}
        <div className="no-print flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold text-gray-800">Struk Transaksi</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1">
              <Printer size={14} />
              Cetak
            </Button>
            <Button size="sm" onClick={onClose} className="gap-1">
              <ShoppingCart size={14} />
              Transaksi Baru
            </Button>
          </div>
        </div>

        {/* Receipt content */}
        <div className="receipt-content overflow-y-auto p-5 font-mono text-xs text-gray-800 space-y-1">
          {/* Store header */}
          <div className="text-center space-y-0.5 pb-2">
            <p className="font-bold text-sm">POS SYSTEM</p>
            <p className="text-gray-500">Toko Serba Ada</p>
            <p className="text-gray-400">{'='.repeat(32)}</p>
          </div>

          {/* Transaction info */}
          <div className="space-y-0.5 pb-2">
            <p>No : {checkoutData.transaction_code}</p>
            <p>Tgl: {formatDate(checkoutData.transaction_date)}</p>
            {customerName && <p>Plg: {customerName}</p>}
          </div>

          <p className="text-gray-400">{'-'.repeat(32)}</p>

          {/* Items */}
          <div className="space-y-1.5 py-1">
            {cart.map((item) => (
              <div key={`${item.product_id}-${item.unit_id}`}>
                <p className="font-medium">
                  {item.product_name} x{item.qty}
                </p>
                <div className="flex justify-between pl-2 text-gray-600">
                  <span>
                    {item.unit_name} @ {formatRupiah(item.effective_price ?? item.price)}
                  </span>
                  <span>{formatRupiah(item.subtotal)}</span>
                </div>
                {item.discount_amount && item.discount_amount > 0 && (
                  <div className="flex justify-between pl-2 text-gray-500">
                    <span>
                      Disc{' '}
                      {item.discount_type === 'percent'
                        ? `${item.discount_value}%`
                        : formatRupiah(item.discount_value ?? 0)}
                    </span>
                    <span>-{formatRupiah(item.discount_amount)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-gray-400">{'-'.repeat(32)}</p>

          {/* Summary */}
          <div className="space-y-0.5 py-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatRupiah(summary.subtotal)}</span>
            </div>
            {summary.discountAmount > 0 && (
              <div className="flex justify-between">
                <span>Diskon{discount.type === 'percent' ? ` (${discount.value}%)` : ''}</span>
                <span>-{formatRupiah(summary.discountAmount)}</span>
              </div>
            )}
            {summary.taxAmount > 0 && (
              <div className="flex justify-between">
                <span>Pajak ({tax.percent}%)</span>
                <span>+{formatRupiah(summary.taxAmount)}</span>
              </div>
            )}
          </div>

          <p className="text-gray-400">{'-'.repeat(32)}</p>

          <div className="space-y-0.5 py-1">
            <div className="flex justify-between font-bold">
              <span>TOTAL</span>
              <span>{formatRupiah(summary.grandTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Bayar ({PAYMENT_LABELS[paymentMethod]})</span>
              <span>{formatRupiah(amountPaid)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Kembalian</span>
              <span>{formatRupiah(Math.max(0, change))}</span>
            </div>
          </div>

          <p className="text-gray-400">{'='.repeat(32)}</p>
          <p className="text-center py-1">Terima kasih!</p>
          <p className="text-gray-400">{'='.repeat(32)}</p>
        </div>
      </div>
    </div>
  )
}
