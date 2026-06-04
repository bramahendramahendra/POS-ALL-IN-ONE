import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { api } from '@/services/api.client'
import { queryKeys } from '@/shared/constants'
import type { Product, ProductPackage } from '@/features/inventory/products'

export const useBarcodeScan = () => {
  const [isScanning, setIsScanning] = useState(false)
  const qc = useQueryClient()

  const handleBarcodeEnter = async (
    code: string
  ): Promise<{ product: Product; units: ProductPackage[] }> => {
    setIsScanning(true)
    try {
      const product = await qc.fetchQuery({
        queryKey: queryKeys.products.barcode(code),
        queryFn: () => api.get<Product>(`/products/barcode/${code}`),
        staleTime: 30_000,
      })
      // Backend mengembalikan Product langsung (sudah termasuk units di dalamnya)
      // units dikosongkan agar ProductSearch fallback ke product.units
      return { product: product as Product, units: [] }
    } finally {
      setIsScanning(false)
    }
  }

  return { handleBarcodeEnter, isScanning }
}
