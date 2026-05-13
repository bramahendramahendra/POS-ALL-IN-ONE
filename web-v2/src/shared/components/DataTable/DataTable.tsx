import { ArrowUpDown } from 'lucide-react'

import { Checkbox } from '@/shared/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { cn } from '@/shared/utils'

import type { DataTableProps, SortState } from './DataTable.types'
import { DataTableEmpty } from './DataTableEmpty'
import { DataTablePagination } from './DataTablePagination'
import { DataTableSkeleton } from './DataTableSkeleton'

export function DataTable<TData extends Record<string, unknown>>({
  columns,
  data,
  isLoading,
  emptyMessage,
  emptyDescription,
  pagination,
  rowSelection,
  onSort,
  className,
}: DataTableProps<TData>) {
  // ─── Row selection helpers ──────────────────────────────────────────────
  const allRowKeys = data.map((row) => row[rowSelection?.rowKey as keyof TData] as string | number)
  const selectedKeys = rowSelection?.selectedKeys ?? new Set<string | number>()
  const allSelected = allRowKeys.length > 0 && allRowKeys.every((k) => selectedKeys.has(k))
  const someSelected = allRowKeys.some((k) => selectedKeys.has(k)) && !allSelected

  const handleSelectAll = () => {
    if (!rowSelection) return
    if (allSelected) {
      const next = new Set(selectedKeys)
      allRowKeys.forEach((k) => next.delete(k))
      rowSelection.onSelectionChange(next)
    } else {
      const next = new Set(selectedKeys)
      allRowKeys.forEach((k) => next.add(k))
      rowSelection.onSelectionChange(next)
    }
  }

  const handleSelectRow = (key: string | number) => {
    if (!rowSelection) return
    const next = new Set(selectedKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    rowSelection.onSelectionChange(next)
  }

  // ─── Sort handler ───────────────────────────────────────────────────────
  const handleSort = (key: string, currentSort?: SortState) => {
    if (!onSort) return
    const order: SortState['order'] =
      currentSort?.key === key && currentSort.order === 'asc' ? 'desc' : 'asc'
    onSort({ key, order })
  }

  // ─── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    const colCount = columns.length + (rowSelection?.enabled ? 1 : 0)
    return <DataTableSkeleton columns={colCount} />
  }

  // ─── Empty ──────────────────────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div className={cn('rounded-md border bg-white', className)}>
        <DataTableEmpty message={emptyMessage} description={emptyDescription} />
      </div>
    )
  }

  return (
    <div className={cn('rounded-md border bg-white', className)}>
      <Table>
        <TableHeader className="sticky top-0 bg-white z-10">
          <TableRow>
            {rowSelection?.enabled && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
            )}
            {columns.map((col) => (
              <TableHead
                key={col.key}
                style={{ width: col.width, textAlign: col.align ?? 'left' }}
                className={col.sortable ? 'cursor-pointer select-none' : ''}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && <ArrowUpDown size={12} className="text-gray-400" />}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIdx) => {
            const rowKey = rowSelection
              ? (row[rowSelection.rowKey as keyof TData] as string | number)
              : rowIdx
            const isSelected = rowSelection?.selectedKeys?.has(rowKey) ?? false

            return (
              <TableRow key={String(rowKey)} data-state={isSelected ? 'selected' : undefined}>
                {rowSelection?.enabled && (
                  <TableCell className="w-10">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectRow(rowKey)}
                    />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell key={col.key} style={{ textAlign: col.align ?? 'left' }}>
                    {col.cell ? col.cell(row) : String(row[col.key as keyof TData] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {pagination && <DataTablePagination {...pagination} />}
    </div>
  )
}
