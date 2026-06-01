import { useState } from 'react'
import { X } from 'lucide-react'

import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { formatRupiah } from '@/shared/utils'

import { useCashierStore } from '../cashier.store'
import { getApplicablePrice } from '../cashier.utils'

export function UnitSelectModal() {
  const [qty, setQty] = useState(1)
  const { unitSelectModalOpen, pendingProduct, addToCart, closeUnitSelectModal } = useCashierStore()

  if (!unitSelectModalOpen || !pendingProduct) return null

  const { product, availableUnits } = pendingProduct

  const handleSelectUnit = (unitId: number, unitName: string) => {
    const price = getApplicablePrice(product.prices, unitId, qty) ?? 0
    const pkg = availableUnits.find((u) => u.unit_id === unitId)
    addToCart({
      product_id: product.id,
      product_name: product.name,
      unit_id: unitId,
      unit_name: unitName,
      conversion_qty: pkg?.conversion_qty ?? 1,
      qty,
      price,
      subtotal: qty * price,
    })
    closeUnitSelectModal()
    setQty(1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div>
            <h2 className="text-base font-semibold">Pilih Unit</h2>
            <p className="text-sm text-gray-500">{product.name}</p>
          </div>
          <button
            onClick={() => {
              closeUnitSelectModal()
              setQty(1)
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Qty input */}
        <div className="flex items-center gap-3 px-5 py-3 border-b bg-gray-50">
          <Label className="text-sm shrink-0">Jumlah:</Label>
          <Input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              if (!isNaN(v) && v > 0) setQty(v)
            }}
            className="h-8 w-24 text-center text-sm"
          />
        </div>

        {/* Unit grid */}
        <div className="grid grid-cols-2 gap-3 p-5">
          {availableUnits.map((unit) => {
            const price = getApplicablePrice(product.prices, unit.unit_id, qty)
            return (
              <button
                key={unit.unit_id}
                onClick={() => handleSelectUnit(unit.unit_id, unit.unit_name)}
                className="flex flex-col items-center gap-1 rounded-lg border-2 border-gray-200 p-4 hover:border-blue-400 hover:bg-blue-50 transition-all active:scale-95"
              >
                <span className="font-semibold text-gray-800">{unit.unit_name}</span>
                {price !== null ? (
                  <span className="text-sm text-blue-600">{formatRupiah(price)}</span>
                ) : (
                  <span className="text-xs text-gray-400">Harga belum diatur</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
