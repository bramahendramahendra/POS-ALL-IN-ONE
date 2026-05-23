import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/services/api.client'
import type { PaginatedResponse } from '@/shared/types'

import type { Expense, ExpenseFilter, ExpenseFormData } from './expenses.types'

export function useExpensesQuery(filter?: ExpenseFilter) {
  return useQuery({
    queryKey: ['expenses', 'list', filter],
    queryFn: () => api.get<PaginatedResponse<Expense>>('/expenses', filter),
  })
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ExpenseFormData) => api.post<Expense>('/expenses', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Pengeluaran berhasil ditambahkan')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateExpenseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: ExpenseFormData & { id: number }) =>
      api.put<Expense>(`/expenses/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Pengeluaran berhasil diperbarui')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Pengeluaran berhasil dihapus')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
