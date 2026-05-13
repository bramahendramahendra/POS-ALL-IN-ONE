import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'

import { initOfflineDetection } from '@/services/notification.service'

import { router } from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      throwOnError: false,
    },
  },
})

export function Providers() {
  useEffect(() => {
    const cleanup = initOfflineDetection()
    return cleanup
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </QueryClientProvider>
  )
}
