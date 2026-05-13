import { useState } from 'react'

import { PageHeader } from '@/shared/components'

import {
  useCashierReportQuery,
  useExportReportMutation,
  useProductReportQuery,
  useSalesReportQuery,
} from './reports.api'
import type { ExportFormat, ReportFilter, ReportType } from './reports.types'
import { ReportFilter as ReportFilterBar } from './components/ReportFilter'
import { ReportTable } from './components/ReportTable'

const PAGE_SIZE = 10

function monthStart(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

export function ReportsPage() {
  const [activeFilter, setActiveFilter] = useState<ReportFilter>({
    type: 'sales',
    date_from: monthStart(),
    date_to: today(),
    group_by: 'day',
    page: 1,
    page_size: PAGE_SIZE,
  })

  const { mutate: exportReport, isPending: isExporting } = useExportReportMutation()

  const salesQuery = useSalesReportQuery(activeFilter)
  const productQuery = useProductReportQuery(activeFilter)
  const cashierQuery = useCashierReportQuery(activeFilter)

  const getActiveQuery = () => {
    if (activeFilter.type === 'sales') return salesQuery
    if (activeFilter.type === 'products') return productQuery
    return cashierQuery
  }

  const { data, isLoading } = getActiveQuery()
  const rows = data?.data?.data ?? []
  const total = data?.data?.total ?? 0

  const handleApply = (filter: ReportFilter) => {
    setActiveFilter({ ...filter, page: 1, page_size: PAGE_SIZE })
  }

  const handleExport = (format: ExportFormat) => {
    exportReport({ ...activeFilter, format })
  }

  const handlePageChange = (page: number) => {
    setActiveFilter((f) => ({ ...f, page }))
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Laporan"
        breadcrumbs={[{ label: 'Reporting' }, { label: 'Laporan' }]}
      />

      <ReportFilterBar
        onApply={handleApply}
        onExport={handleExport}
        isExporting={isExporting}
      />

      <ReportTable
        reportType={activeFilter.type as ReportType}
        data={rows}
        isLoading={isLoading}
        pagination={{ page: activeFilter.page ?? 1, pageSize: PAGE_SIZE, total, onPageChange: handlePageChange }}
      />
    </div>
  )
}
