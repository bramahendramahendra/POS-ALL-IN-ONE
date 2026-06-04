import { useState } from 'react'

import { useDebounce } from '@/shared/hooks'

import { useProductSearchQuery } from '../cashier.api'
import type { ProductSearchResult } from '../cashier.types'

export const useProductSearch = () => {
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)

  const { data, isLoading } = useProductSearchQuery(
    debouncedKeyword,
    debouncedKeyword.length >= 2
  )

  const results: ProductSearchResult[] = Array.isArray(data) ? data : []
  const clearSearch = () => setKeyword('')

  return { keyword, setKeyword, results, isLoading, clearSearch }
}
