import { formatRupiah } from '@/shared/utils'
import { Input } from '@/shared/components/ui/input'

import { useCashierStore } from '../cashier.store'
import { calcDiscountAmount, calcSubtotal } from '../cashier.utils'
import type { DiscountType } from '../cashier.types'

export function DiscountInput() {
  const { cart, discount, setDiscount } = useCashierStore()
  const subtotal = calcSubtotal(cart)

  const handleTypeChange = (type: DiscountType) => {
    setDiscount({ type, value: type === 'none' ? 0 : discount.value })
  }

  const handleValueChange = (raw: string) => {
    const v = parseFloat(raw)
    if (isNaN(v) || v < 0) return
    const capped =
      discount.type === 'percent'
        ? Math.min(v, 100)
        : discount.type === 'amount'
          ? Math.min(v, subtotal)
          : 0
    setDiscount({ type: discount.type, value: capped })
  }

  const previewAmount = calcDiscountAmount(subtotal, discount)

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t text-sm">
      <span className="text-gray-600 shrink-0 w-12">Diskon</span>

      {/* Type toggle */}
      <div className="flex rounded-md border overflow-hidden text-xs shrink-0">
        {(['none', 'percent', 'amount'] as DiscountType[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTypeChange(t)}
            className={`px-2 py-1 transition-colors ${
              discount.type === t
                ? 'bg-[#2c3e50] text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t === 'none' ? '—' : t === 'percent' ? '%' : 'Rp'}
          </button>
        ))}
      </div>

      {/* Value input */}
      {discount.type !== 'none' && (
        <Input
          type="number"
          min={0}
          max={discount.type === 'percent' ? 100 : subtotal}
          value={discount.value}
          onChange={(e) => handleValueChange(e.target.value)}
          className="h-7 w-20 text-sm text-right px-2"
        />
      )}

      {/* Preview */}
      {previewAmount > 0 && (
        <span className="ml-auto text-green-600 text-xs shrink-0">
          -{formatRupiah(previewAmount)}
        </span>
      )}
    </div>
  )
}
