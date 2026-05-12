import { useState } from 'react'

import { useDebounce } from '@/shared/hooks'

import { useProductSearchQuery } from '../cashier.api'

export const useProductSearch = () => {
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)

  const { data: results, isLoading } = useProductSearchQuery(
    debouncedKeyword,
    debouncedKeyword.length >= 2
  )

  const clearSearch = () => setKeyword('')

  return { keyword, setKeyword, results: results ?? [], isLoading, clearSearch }
}
