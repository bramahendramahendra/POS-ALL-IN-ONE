import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { api } from '@/services/api.client'
import { queryKeys } from '@/shared/constants'
import { ROUTES } from '@/shared/constants/routes'
import type { ApiResponse } from '@/shared/types'
import type { Product, ProductPackage } from '@/features/inventory/products'

import { useCashierStore } from './cashier.store'
import type { CheckoutResponse, PaymentPayload, ProductSearchResult } from './cashier.types'

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useProductSearchQuery(keyword: string, enabled: boolean) {
  return useQuery({
    queryKey: ['cashier', 'search', keyword],
    queryFn: () => api.get<ProductSearchResult[]>('/products/search', { q: keyword, limit: 20 }),
    enabled: enabled && keyword.length >= 2,
  })
}

export function useProductBarcodeSearchQuery(code: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.products.barcode(code),
    queryFn: () => api.get<Product>(`/products/barcode/${code}`),
    enabled: enabled && code.length > 0,
  })
}

export { useCustomerListQuery } from '@/features/customers'
export { useActiveShiftQuery } from '@/features/shifts'

export function useCustomerCreditQuery(customerId: number | null) {
  return useQuery({
    queryKey: ['customers', 'credit', customerId],
    queryFn: () =>
      api.get<ApiResponse<{ id: number; name: string; credit_limit: number; outstanding_amount: number }>>(
        `/customers/${customerId}`
      ),
    enabled: customerId !== null && customerId > 0,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCheckoutMutation() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { clearCart, closePaymentModal } = useCashierStore()

  return useMutation({
    mutationFn: (payload: PaymentPayload) =>
      api.post<CheckoutResponse>('/transactions', payload),
    onSuccess: (data) => {
      clearCart()
      closePaymentModal()
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all() })
      toast.success(`Transaksi ${(data as unknown as CheckoutResponse).transaction_code} berhasil`)
      navigate(`${ROUTES.TRANSACTIONS}/${(data as unknown as CheckoutResponse).id}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
