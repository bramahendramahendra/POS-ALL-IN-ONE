import { PageHeader } from '@/shared/components'

import { ProfitLossTab } from './components/ProfitLossTab'

export function ProfitLossPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Laporan Laba Rugi"
        breadcrumbs={[{ label: 'Pelaporan' }, { label: 'Laba Rugi' }]}
      />
      <ProfitLossTab />
    </div>
  )
}
