import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/services/api.client'
import type { PaginatedResponse } from '@/shared/types'

import type { Expense, ExpenseFilter, ExpenseFormData } from './expenses.types'

export function useExpensesQuery(filter?: ExpenseFilter) {
  return useQuery({
    queryKey: ['expenses', 'list', filter],
    queryFn: () => api.get<PaginatedResponse<Expense>>('/expenses', filter),
  })
}

export function useExpenseDetailQuery(id: number | null) {
  return useQuery({
    queryKey: ['expenses', 'detail', id],
    queryFn: () => api.get<Expense>(`/expenses/${id}`),
    enabled: id !== null,
  })
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ExpenseFormData) => api.post<Expense>('/expenses', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

export function useUpdateExpenseMutation(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ExpenseFormData) => api.put<Expense>(`/expenses/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}
