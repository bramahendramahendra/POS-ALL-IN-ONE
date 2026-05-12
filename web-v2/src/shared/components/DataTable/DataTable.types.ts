import type { ReactNode } from 'react'

export interface ColumnDef<TData> {
  key: string
  header: string
  cell?: (row: TData) => ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
}

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
}

export interface RowSelectionProps<TData> {
  enabled: boolean
  selectedKeys?: Set<string | number>
  rowKey: keyof TData
  onSelectionChange: (keys: Set<string | number>) => void
}

export interface SortState {
  key: string
  order: 'asc' | 'desc'
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  isLoading?: boolean
  emptyMessage?: string
  emptyDescription?: string
  pagination?: PaginationProps
  rowSelection?: RowSelectionProps<TData>
  onSort?: (sort: SortState) => void
  className?: string
}
