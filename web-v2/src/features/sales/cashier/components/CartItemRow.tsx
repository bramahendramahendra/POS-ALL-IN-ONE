import { useState } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { formatRupiah } from '@/shared/utils'

import { useCashierStore } from '../cashier.store'
import type { CartItem } from '../cashier.types'

interface CartItemRowProps {
  item: CartItem
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateQty, updatePrice, updateNotes, removeFromCart } = useCashierStore()
  const [editingPrice, setEditingPrice] = useState(false)
  const [priceInput, setPriceInput] = useState(String(item.price))

  const handleQtyChange = (raw: string) => {
    const v = parseInt(raw, 10)
    if (!isNaN(v) && v > 0) updateQty(item.product_id, item.unit_id, v)
  }

  const handlePriceCommit = () => {
    const v = parseFloat(priceInput)
    if (!isNaN(v) && v >= 0) updatePrice(item.product_id, item.unit_id, v)
    else setPriceInput(String(item.price))
    setEditingPrice(false)
  }

  return (
    <li className="px-4 py-3 space-y-1.5">
      {/* Row 1: Name + delete */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
          <p className="text-xs text-gray-400">{item.unit_name}</p>
        </div>
        <button
          onClick={() => removeFromCart(item.product_id, item.unit_id)}
          className="text-gray-300 hover:text-red-500 transition-colors mt-0.5 shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Row 2: Price (editable) + Subtotal */}
      <div className="flex items-center justify-between gap-2">
        {editingPrice ? (
          <Input
            autoFocus
            type="number"
            min={0}
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            onBlur={handlePriceCommit}
            onKeyDown={(e) => { if (e.key === 'Enter') handlePriceCommit() }}
            className="h-6 w-28 text-xs px-2"
          />
        ) : (
          <button
            onClick={() => { setPriceInput(String(item.price)); setEditingPrice(true) }}
            className="text-xs text-blue-600 hover:underline"
            title="Klik untuk ubah harga"
          >
            {formatRupiah(item.price)}
          </button>
        )}
        <span className="text-sm font-semibold text-gray-800 shrink-0">
          = {formatRupiah(item.subtotal)}
        </span>
      </div>

      {/* Row 3: Qty controls */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => updateQty(item.product_id, item.unit_id, item.qty - 1)}
        >
          <Minus size={10} />
        </Button>
        <Input
          type="number"
          value={item.qty}
          onChange={(e) => handleQtyChange(e.target.value)}
          className="h-6 w-14 text-center text-sm px-1"
          min={1}
        />
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => updateQty(item.product_id, item.unit_id, item.qty + 1)}
        >
          <Plus size={10} />
        </Button>
      </div>

      {/* Row 4: Notes */}
      <Input
        placeholder="Catatan (opsional)"
        value={item.notes ?? ''}
        onChange={(e) => updateNotes(item.product_id, item.unit_id, e.target.value)}
        className="h-6 text-xs px-2"
      />
    </li>
  )
}
