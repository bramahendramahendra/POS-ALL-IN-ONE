import { useState } from 'react'

import { PageHeader } from '@/shared/components'
import { usePagination } from '@/shared/hooks'

import { useTransactionListQuery } from './transactions.api'
import type { TransactionFilter } from './transactions.types'
import { TransactionFilterBar } from './components/TransactionFilter'
import { TransactionTable } from './components/TransactionTable'
import { TransactionDetailModal } from './components/TransactionDetailModal'

const DEFAULT_FILTER: TransactionFilter = {}

export function TransactionsPage() {
  const [filter, setFilter] = useState<TransactionFilter>(DEFAULT_FILTER)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { page, pageSize, onPageChange, onPageSizeChange, reset } = usePagination()

  const { data: txData, isLoading } = useTransactionListQuery({
    ...filter,
    page,
    limit: pageSize,
  })

  const transactions = txData?.data?.data ?? []
  const total = txData?.data?.total ?? 0

  const handleFilterChange = (newFilter: TransactionFilter) => {
    setFilter(newFilter)
    reset()
  }

  const handleReset = () => {
    setFilter(DEFAULT_FILTER)
    reset()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Transaksi"
        breadcrumbs={[{ label: 'Penjualan' }, { label: 'Transaksi' }]}
      />

      <TransactionFilterBar filter={filter} onChange={handleFilterChange} onReset={handleReset} />

      <TransactionTable
        data={transactions}
        isLoading={isLoading}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange,
          onPageSizeChange,
          pageSizeOptions: [10, 20, 50],
        }}
        onDetail={(t) => setSelectedId(t.id)}
        onVoid={(t) => setSelectedId(t.id)}
      />

      <TransactionDetailModal transactionId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
