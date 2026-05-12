import { useState } from 'react'
import { ShoppingCart, Trash2 } from 'lucide-react'

import { ConfirmDialog } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { formatRupiah } from '@/shared/utils'

import { useCustomerListQuery } from '../cashier.api'
import { useCashierStore } from '../cashier.store'
import { calcCartSummary } from '../cashier.utils'
import { CartItemRow } from './CartItemRow'
import { DiscountInput } from './DiscountInput'
import { TaxInput } from './TaxInput'

export function CartPanel() {
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  const {
    cart,
    discount,
    tax,
    selectedCustomer,
    setCustomer,
    clearCart,
    openPaymentModal,
  } = useCashierStore()

  const { data: customers = [] } = useCustomerListQuery()
  const summary = calcCartSummary(cart, discount, tax)
  const itemCount = cart.reduce((s, i) => s + i.qty, 0)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3 shrink-0">
        <ShoppingCart size={18} className="text-gray-600" />
        <h2 className="font-semibold text-gray-800">
          Keranjang
          {itemCount > 0 && (
            <span className="ml-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {itemCount}
            </span>
          )}
        </h2>
      </div>

      {/* Customer selector */}
      <div className="border-b px-4 py-2 shrink-0">
        <Select
          value={selectedCustomer ? String(selectedCustomer.id) : 'none'}
          onValueChange={(v) => {
            if (v === 'none') {
              setCustomer(null)
            } else {
              const c = customers.find((c) => String(c.id) === v)
              if (c) setCustomer({ id: c.id, name: c.name })
            }
          }}
        >
          <SelectTrigger className="h-8 text-sm border-dashed">
            <SelectValue placeholder="Pilih pelanggan (opsional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Tanpa Pelanggan —</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cart Items — scrollable */}
      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
            <ShoppingCart size={32} className="opacity-30" />
            <p className="text-sm">Keranjang kosong</p>
          </div>
        ) : (
          <ul className="divide-y">
            {cart.map((item) => (
              <CartItemRow
                key={`${item.product_id}-${item.unit_id}`}
                item={item}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Discount & Tax */}
      {cart.length > 0 && (
        <>
          <DiscountInput />
          <TaxInput />
        </>
      )}

      {/* Summary */}
      <div className="border-t px-4 py-3 space-y-1.5 bg-gray-50 text-sm shrink-0">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatRupiah(summary.subtotal)}</span>
        </div>
        {summary.discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>
              Diskon{discount.type === 'percent' ? ` (-${discount.value}%)` : ''}
            </span>
            <span>-{formatRupiah(summary.discountAmount)}</span>
          </div>
        )}
        {summary.taxAmount > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Pajak ({tax.percent}%)</span>
            <span>+{formatRupiah(summary.taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-2 font-bold text-gray-900 text-base">
          <span>TOTAL</span>
          <span>{formatRupiah(summary.grandTotal)}</span>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex gap-2 border-t px-4 py-3 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => setClearConfirmOpen(true)}
          disabled={cart.length === 0}
        >
          <Trash2 size={14} />
          Kosongkan
        </Button>
        <Button
          className="flex-1 gap-1"
          onClick={openPaymentModal}
          disabled={cart.length === 0}
        >
          💳 Bayar
        </Button>
      </div>

      <ConfirmDialog
        open={clearConfirmOpen}
        onOpenChange={setClearConfirmOpen}
        title="Kosongkan Keranjang"
        description="Semua item di keranjang akan dihapus. Yakin?"
        confirmLabel="Ya, Kosongkan"
        variant="destructive"
        onConfirm={() => { clearCart(); setClearConfirmOpen(false) }}
      />
    </div>
  )
}
