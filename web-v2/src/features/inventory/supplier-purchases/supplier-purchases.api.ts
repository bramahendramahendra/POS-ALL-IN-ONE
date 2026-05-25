import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services/api.client'

import type {
  CreateSupplierPurchasePayload,
  PurchasePayment,
  SupplierPurchase,
  SupplierPurchaseFilter,
  SupplierPurchasePayment,
} from './supplier-purchases.types'

interface SupplierPurchaseListData {
  items: SupplierPurchase[]
  total: number
  page: number
  limit: number
}

function normalizeStatus(purchase: SupplierPurchase): SupplierPurchase {
  const map: Record<string, SupplierPurchase['payment_status']> = {
    paid: 'lunas',
    unpaid: 'hutang',
    partial: 'partial',
    lunas: 'lunas',
    hutang: 'hutang',
  }
  const raw = (purchase.payment_status as string) ?? ''
  return { ...purchase, payment_status: (map[raw] ?? 'hutang') as SupplierPurchase['payment_status'] }
}

const QK = {
  all: () => ['supplierPurchases'] as const,
  list: (filter?: SupplierPurchaseFilter) => ['supplierPurchases', 'list', filter] as const,
  detail: (id: number) => ['supplierPurchases', 'detail', id] as const,
}

export function useSupplierPurchasesQuery(filter?: SupplierPurchaseFilter) {
  return useQuery({
    queryKey: QK.list(filter),
    queryFn: async () => {
      const { page_size, ...rest } = filter ?? {}
      const data = await api.get<SupplierPurchaseListData>('/supplier-purchases', { ...rest, limit: page_size })
      return { ...data, items: data.items.map(normalizeStatus) }
    },
  })
}

export function useSupplierPurchaseDetailQuery(id: number | null) {
  return useQuery({
    queryKey: QK.detail(id ?? 0),
    queryFn: async () => normalizeStatus(await api.get<SupplierPurchase>(`/supplier-purchases/${id}`)),
    enabled: id !== null && id > 0,
  })
}

export function useGeneratePurchaseCodeQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['purchaseGenerateCode', enabled],
    queryFn: () => api.get<{ purchase_code: string }>('/supplier-purchases/generate-code'),
    enabled,
    staleTime: 0,
  })
}

export function useCreateSupplierPurchaseMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSupplierPurchasePayload) =>
      api.post<SupplierPurchase>('/supplier-purchases', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all() })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteSupplierPurchaseMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/supplier-purchases/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all() })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useSupplierPurchasePaymentsQuery(id: number | null) {
  return useQuery({
    queryKey: [...QK.detail(id ?? 0), 'payments'],
    queryFn: () => api.get<PurchasePayment[]>(`/supplier-purchases/${id}/payments`),
    enabled: id !== null && id > 0,
  })
}

export function usePaySupplierPurchaseMutation(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SupplierPurchasePayment) =>
      api.post<void>(`/supplier-purchases/${id}/pay`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all() })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
