import { useEffect, useRef, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

import { Input } from '@/shared/components/ui/input'
import { formatRupiah } from '@/shared/utils'
import { queryKeys } from '@/shared/constants'
import { api } from '@/services/api.client'
import type { Product, ProductPackage, PriceTier } from '@/features/inventory/products'

import { useCashierStore } from '../cashier.store'
import { getApplicablePrice } from '../cashier.utils'
import { useBarcodeScan } from '../hooks/useBarcodeScan'
import { useProductSearch } from '../hooks/useProductSearch'
import type { ProductSearchResult } from '../cashier.types'

export function ProductSearch() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { keyword, setKeyword, results, isLoading, clearSearch } = useProductSearch()
  const { handleBarcodeEnter, isScanning } = useBarcodeScan()
  const { addToCart, openUnitSelectModal } = useCashierStore()
  const qc = useQueryClient()
  const [loadingId, setLoadingId] = useState<number | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const fetchFullProduct = async (id: number): Promise<Product> => {
    const [product, packages, prices] = await Promise.all([
      qc.fetchQuery({
        queryKey: queryKeys.products.detail(id),
        queryFn: () => api.get<Product>(`/products/${id}`),
        staleTime: 60_000,
      }) as Promise<Product>,
      qc.fetchQuery({
        queryKey: queryKeys.products.productUnits(id),
        queryFn: () => api.get<ProductPackage[]>(`/products/${id}/packages`),
        staleTime: 60_000,
      }) as Promise<ProductPackage[]>,
      qc.fetchQuery({
        queryKey: queryKeys.products.priceTiers(id),
        queryFn: () => api.get<PriceTier[]>(`/products/${id}/prices`),
        staleTime: 60_000,
      }) as Promise<PriceTier[]>,
    ])
    return {
      ...product,
      units: Array.isArray(packages) ? packages : [],
      prices: Array.isArray(prices) ? prices : [],
    }
  }

  const handleAddProduct = async (item: ProductSearchResult) => {
    setLoadingId(item.id)
    try {
      const product = await fetchFullProduct(item.id)
      const units = product.units ?? []
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
    } catch {
      toast.error('Gagal memuat data produk')
    } finally {
      setLoadingId(null)
    }
  }

  const addItemToCart = (product: Product, unitId: number, unitName: string) => {
    const price = getApplicablePrice(product.prices, unitId, 1) ?? 0
    const pkg = product.units.find((u) => u.unit_id === unitId)
    addToCart({
      product_id: product.id,
      product_name: product.name,
      unit_id: unitId,
      unit_name: unitName,
      conversion_qty: pkg?.conversion_qty ?? 1,
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
      const { product } = await handleBarcodeEnter(keyword.trim())
      const units = product.units ?? []
      if (units.length === 0) {
        toast.error('Produk ini belum memiliki unit')
        return
      }
      if (units.length === 1) {
        addItemToCart(product, units[0].unit_id, units[0].unit_name)
      } else {
        openUnitSelectModal(product, units)
      }
    } catch {
      toast.error('Produk dengan barcode tersebut tidak ditemukan')
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        {(isLoading || isScanning) && (
          <Loader2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
          />
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
            results.map((item: ProductSearchResult) => (
              <button
                key={item.id}
                onClick={() => handleAddProduct(item)}
                disabled={loadingId === item.id}
                className="flex flex-col items-center gap-1.5 rounded-lg border bg-white p-3 text-center shadow-sm hover:border-blue-400 hover:shadow-md transition-all active:scale-95 disabled:opacity-60"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg">
                  {loadingId === item.id ? (
                    <Loader2 size={18} className="animate-spin text-gray-400" />
                  ) : (
                    '📦'
                  )}
                </div>
                <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight">
                  {item.name}
                </p>
                <p className="text-xs font-semibold text-blue-600">
                  {formatRupiah(item.selling_price)}
                  {item.unit_name ? `/${item.unit_name}` : ''}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
