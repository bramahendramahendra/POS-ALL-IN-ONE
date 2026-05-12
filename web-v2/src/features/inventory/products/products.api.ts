import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services'
import { queryKeys } from '@/shared/constants'
import type { PaginatedResponse } from '@/shared/types'

import type {
  Category,
  CreateCategoryPayload,
  CreatePriceTierPayload,
  CreateProductPayload,
  CreateProductUnitPayload,
  CreateUnitPayload,
  PriceTier,
  Product,
  ProductFilter,
  ProductUnit,
  Unit,
  UpdateCategoryPayload,
  UpdatePriceTierPayload,
  UpdateProductPayload,
  UpdateProductUnitPayload,
  UpdateUnitPayload,
} from './products.types'

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useProductListQuery(filter?: ProductFilter) {
  return useQuery({
    queryKey: queryKeys.products.list(filter as Record<string, unknown>),
    queryFn: () => api.get<PaginatedResponse<Product>>('/products', filter),
  })
}

export function useProductDetailQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => api.get<Product>(`/products/${id}`),
    enabled: id > 0,
  })
}

export function useProductBarcodeQuery(code: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.products.barcode(code),
    queryFn: () => api.get<{ product: Product }>(`/products/barcode/${code}`),
    enabled: enabled && code.length > 0,
  })
}

export function useCategoryListQuery() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => api.get<Category[]>('/categories'),
  })
}

export function useUnitListQuery() {
  return useQuery({
    queryKey: queryKeys.units.list(),
    queryFn: () => api.get<Unit[]>('/units'),
  })
}

export function useProductUnitsQuery(productId: number) {
  return useQuery({
    queryKey: queryKeys.products.priceTiers(productId),
    queryFn: () => api.get<ProductUnit[]>(`/products/${productId}/units`),
    enabled: productId > 0,
  })
}

export function useProductPricesQuery(productId: number) {
  return useQuery({
    queryKey: queryKeys.products.priceTiers(productId),
    queryFn: () => api.get<PriceTier[]>(`/products/${productId}/prices`),
    enabled: productId > 0,
  })
}

// ─── Product Mutations ────────────────────────────────────────────────────────

export function useCreateProductMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => api.post<Product>('/products', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.products.all() }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateProductMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateProductPayload & { id: number }) =>
      api.put<Product>(`/products/${id}`, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all() })
      qc.invalidateQueries({ queryKey: queryKeys.products.detail(id) })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteProductMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.products.all() }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Category Mutations ───────────────────────────────────────────────────────

export function useCreateCategoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => api.post<Category>('/categories', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.categories.all() }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateCategoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCategoryPayload & { id: number }) =>
      api.put<Category>(`/categories/${id}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.categories.all() }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteCategoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.categories.all() }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Unit Mutations ───────────────────────────────────────────────────────────

export function useCreateUnitMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUnitPayload) => api.post<Unit>('/units', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.units.all() }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateUnitMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateUnitPayload & { id: number }) =>
      api.put<Unit>(`/units/${id}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.units.all() }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteUnitMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/units/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.units.all() }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Product Unit Mutations ───────────────────────────────────────────────────

export function useAddProductUnitMutation(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProductUnitPayload) =>
      api.post<ProductUnit>(`/products/${productId}/units`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.products.detail(productId) }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateProductUnitMutation(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ unitId, ...payload }: UpdateProductUnitPayload) =>
      api.put<ProductUnit>(`/products/${productId}/units/${unitId}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.products.detail(productId) }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteProductUnitMutation(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (unitId: number) => api.delete<void>(`/products/${productId}/units/${unitId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.products.detail(productId) }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Price Tier Mutations ─────────────────────────────────────────────────────

export function useAddPriceTierMutation(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePriceTierPayload) =>
      api.post<PriceTier>(`/products/${productId}/prices`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.products.priceTiers(productId) }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdatePriceTierMutation(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ priceId, ...payload }: UpdatePriceTierPayload) =>
      api.put<PriceTier>(`/products/${productId}/prices/${priceId}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.products.priceTiers(productId) }) },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeletePriceTierMutation(productId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (priceId: number) => api.delete<void>(`/products/${productId}/prices/${priceId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.products.priceTiers(productId) }) },
    onError: (e: Error) => toast.error(e.message),
  })
}
