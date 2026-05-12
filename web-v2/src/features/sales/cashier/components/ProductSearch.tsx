import { useEffect, useRef } from 'react'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'

import { Input } from '@/shared/components/ui/input'
import { formatRupiah } from '@/shared/utils'
import type { Product } from '@/features/inventory/products'

import { useCashierStore } from '../cashier.store'
import { getApplicablePrice } from '../cashier.utils'
import { useBarcodeScan } from '../hooks/useBarcodeScan'
import { useProductSearch } from '../hooks/useProductSearch'

export function ProductSearch() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { keyword, setKeyword, results, isLoading, clearSearch } = useProductSearch()
  const { handleBarcodeEnter, isScanning } = useBarcodeScan()
  const { addToCart, openUnitSelectModal } = useCashierStore()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleAddProduct = (product: Product) => {
    const units = product.units
    if (units.length === 0) {
      toast.error('Produk ini belum memiliki unit')
      return
    }
    if (units.length === 1) {
      addItemToCart(product, units[0].unit_id, units[0].unit_name)
    } else {
      openUnitSelectModal(product, units)
    }
    clearSearch()
  }

  const addItemToCart = (product: Product, unitId: number, unitName: string) => {
    const price = getApplicablePrice(product.prices, unitId, 1) ?? 0
    const unit = product.units.find((u) => u.unit_id === unitId)
    addToCart({
      product_id: product.id,
      product_name: product.name,
      unit_id: unitId,
      unit_name: unitName,
      barcode: unit?.barcode,
      qty: 1,
      price,
      subtotal: price,
    })
    clearSearch()
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !keyword.trim()) return
    e.preventDefault()
    try {
      const { product, units } = await handleBarcodeEnter(keyword.trim())
      if (!units || units.length === 0) {
        if (product.units.length === 1) {
          addItemToCart(product, product.units[0].unit_id, product.units[0].unit_name)
        } else {
          openUnitSelectModal(product, product.units)
        }
      } else if (units.length === 1) {
        addItemToCart(product, units[0].unit_id, units[0].unit_name)
      } else {
        openUnitSelectModal(product, units)
      }
    } catch {
      toast.error('Produk dengan barcode tersebut tidak ditemukan')
    }
  }

  const getDefaultPrice = (product: Product): number | null => {
    const defaultUnit = product.units.find((u) => u.is_default)
    if (!defaultUnit) return null
    return getApplicablePrice(product.prices, defaultUnit.unit_id, 1)
  }

  const getDefaultUnitName = (product: Product): string => {
    const defaultUnit = product.units.find((u) => u.is_default)
    return defaultUnit?.unit_name ?? (product.units[0]?.unit_name ?? '')
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        {(isLoading || isScanning) && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
        <Input
          ref={inputRef}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Cari produk atau scan barcode..."
          className="pl-9 pr-9 h-11 text-base"
        />
      </div>

      {/* Results Grid */}
      {keyword.length >= 2 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {results.length === 0 && !isLoading ? (
            <p className="col-span-full text-center text-sm text-gray-400 py-8">
              Produk tidak ditemukan
            </p>
          ) : (
            results.map((product: Product) => {
              const price = getDefaultPrice(product)
              const unitName = getDefaultUnitName(product)
              return (
                <button
                  key={product.id}
                  onClick={() => handleAddProduct(product)}
                  className="flex flex-col items-center gap-1.5 rounded-lg border bg-white p-3 text-center shadow-sm hover:border-blue-400 hover:shadow-md transition-all active:scale-95"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg">
                    📦
                  </div>
                  <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight">
                    {product.name}
                  </p>
                  {price !== null ? (
                    <p className="text-xs font-semibold text-blue-600">
                      {formatRupiah(price)}{unitName ? `/${unitName}` : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">—</p>
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
