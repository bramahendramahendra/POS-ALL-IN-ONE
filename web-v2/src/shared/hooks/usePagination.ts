import { useState } from 'react'

interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
}

interface UsePaginationReturn {
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  reset: () => void
}

export function usePagination(options?: UsePaginationOptions): UsePaginationReturn {
  const initialPage = options?.initialPage ?? 1
  const initialPageSize = options?.initialPageSize ?? 10

  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const onPageChange = (newPage: number) => setPage(newPage)

  const onPageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const reset = () => setPage(1)

  return { page, pageSize, onPageChange, onPageSizeChange, reset }
}
