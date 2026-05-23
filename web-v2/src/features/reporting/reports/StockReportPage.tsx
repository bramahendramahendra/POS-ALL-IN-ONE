import { PageHeader } from '@/shared/components'

import { StockReportTab } from './components/StockReportTab'

export function StockReportPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Laporan Stok"
        breadcrumbs={[{ label: 'Pelaporan' }, { label: 'Stok' }]}
      />
      <StockReportTab />
    </div>
  )
}
