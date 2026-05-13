import { useState, useCallback } from 'react'

interface UseTableSelectionReturn<T> {
  selectedKeys: Set<number | string>
  selectedItems: T[]
  isSelected: (key: number | string) => boolean
  toggle: (key: number | string) => void
  selectAll: (items: T[]) => void
  clearSelection: () => void
  hasSelection: boolean
  count: number
}

export function useTableSelection<T extends { id: number | string }>(): UseTableSelectionReturn<T> {
  const [selectedKeys, setSelectedKeys] = useState<Set<number | string>>(new Set())
  const [selectedItems, setSelectedItems] = useState<T[]>([])

  const isSelected = useCallback((key: number | string) => selectedKeys.has(key), [selectedKeys])

  const toggle = useCallback((key: number | string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const selectAll = useCallback((items: T[]) => {
    setSelectedKeys(new Set(items.map((item) => item.id)))
    setSelectedItems(items)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set())
    setSelectedItems([])
  }, [])

  return {
    selectedKeys,
    selectedItems,
    isSelected,
    toggle,
    selectAll,
    clearSelection,
    hasSelection: selectedKeys.size > 0,
    count: selectedKeys.size,
  }
}
