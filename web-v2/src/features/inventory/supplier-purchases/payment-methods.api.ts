import { useQuery } from '@tanstack/react-query'

import { api } from '@/services/api.client'

import type { PaymentMethodOption } from './payment-methods.types'

export function usePaymentMethodsQuery() {
  return useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => api.get<PaymentMethodOption[]>('/payment-methods'),
    staleTime: 5 * 60 * 1000,
  })
}
