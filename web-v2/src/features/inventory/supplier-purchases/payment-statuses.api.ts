import { useQuery } from '@tanstack/react-query'

import { api } from '@/services/api.client'

import type { PaymentStatusOption } from './payment-statuses.types'

export function usePaymentStatusesQuery() {
  return useQuery({
    queryKey: ['paymentStatuses'],
    queryFn: () => api.get<PaymentStatusOption[]>('/payment-statuses'),
    staleTime: 5 * 60 * 1000,
  })
}
