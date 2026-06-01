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
      const result = await qc.fetchQuery({
        queryKey: queryKeys.products.barcode(code),
        queryFn: () =>
          api.get<{ product: Product; units: ProductPackage[] }>(`/products/barcode/${code}`),
        staleTime: 30_000,
      })
      return result as { product: Product; units: ProductPackage[] }
    } finally {
      setIsScanning(false)
    }
  }

  return { handleBarcodeEnter, isScanning }
}
