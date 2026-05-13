import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api, apiClient } from '@/services/api.client'
import { queryKeys } from '@/shared/constants'
import type { PaginatedResponse } from '@/shared/types'

import type {
  CashierReportRow,
  ExportFormat,
  ProductReportRow,
  ReportFilter,
  ReportType,
  SalesReportRow,
} from './reports.types'

function reportQueryKey(type: ReportType, filter: ReportFilter) {
  return queryKeys.reports.data({ ...filter, type } as Record<string, unknown>)
}

export function useSalesReportQuery(filter: ReportFilter) {
  return useQuery({
    queryKey: reportQueryKey('sales', filter),
    queryFn: () => api.get<PaginatedResponse<SalesReportRow>>('/reports/sales', filter),
    enabled: filter.type === 'sales',
  })
}

export function useProductReportQuery(filter: ReportFilter) {
  return useQuery({
    queryKey: reportQueryKey('products', filter),
    queryFn: () => api.get<PaginatedResponse<ProductReportRow>>('/reports/products', filter),
    enabled: filter.type === 'products',
  })
}

export function useCashierReportQuery(filter: ReportFilter) {
  return useQuery({
    queryKey: reportQueryKey('cashiers', filter),
    queryFn: () => api.get<PaginatedResponse<CashierReportRow>>('/reports/cashiers', filter),
    enabled: filter.type === 'cashiers',
  })
}

export function useExportReportMutation() {
  return useMutation({
    mutationFn: async (filter: ReportFilter & { format: ExportFormat }) => {
      const response = await apiClient.get('/reports/export', {
        params: filter,
        responseType: 'blob',
      })
      const url = URL.createObjectURL(response.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `laporan-${filter.type}-${filter.date_from}.${filter.format}`
      a.click()
      URL.revokeObjectURL(url)
    },
    onSuccess: () => toast.success('Laporan berhasil diunduh'),
    onError: () => toast.error('Gagal mengunduh laporan'),
  })
}
