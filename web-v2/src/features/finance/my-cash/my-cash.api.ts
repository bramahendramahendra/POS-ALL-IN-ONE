import { useQuery } from '@tanstack/react-query'

import { api } from '@/services/api.client'
import type { ApiResponse } from '@/shared/types'

import type { MyCashData } from './my-cash.types'

export function useMyCashQuery() {
  return useQuery({
    queryKey: ['myCash'],
    queryFn: () => api.get<ApiResponse<MyCashData>>('/cash-drawer/my-cash'),
  })
}
