import { formatRupiah } from '@/shared/utils'
import { Input } from '@/shared/components/ui/input'

import { useCashierStore } from '../cashier.store'
import { calcDiscountAmount, calcSubtotal, calcTaxAmount } from '../cashier.utils'

export function TaxInput() {
  const { cart, discount, tax, setTax } = useCashierStore()

  const subtotal = calcSubtotal(cart)
  const discountAmount = calcDiscountAmount(subtotal, discount)
  const previewTax = calcTaxAmount(subtotal, discountAmount, tax.percent)

  const handleChange = (raw: string) => {
    const v = parseFloat(raw)
    if (isNaN(v) || v < 0) return
    setTax(Math.min(v, 100))
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t text-sm">
      <span className="text-gray-600 shrink-0 w-12">Pajak</span>

      <Input
        type="number"
        min={0}
        max={100}
        value={tax.percent}
        onChange={(e) => handleChange(e.target.value)}
        className="h-7 w-20 text-sm text-right px-2"
      />
      <span className="text-gray-400 text-xs">%</span>

      {previewTax > 0 && (
        <span className="ml-auto text-gray-600 text-xs shrink-0">+{formatRupiah(previewTax)}</span>
      )}
    </div>
  )
}
