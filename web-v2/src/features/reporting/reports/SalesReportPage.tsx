import { PageHeader } from '@/shared/components'

import { SalesReportTab } from './components/SalesReportTab'

export function SalesReportPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Laporan Penjualan"
        breadcrumbs={[{ label: 'Pelaporan' }, { label: 'Penjualan' }]}
      />
      <SalesReportTab />
    </div>
  )
}
