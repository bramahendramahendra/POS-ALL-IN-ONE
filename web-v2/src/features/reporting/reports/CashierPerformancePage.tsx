import { PageHeader } from '@/shared/components'

import { CashierPerformanceTab } from './components/CashierPerformanceTab'

export function CashierPerformancePage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Kinerja Kasir"
        breadcrumbs={[{ label: 'Pelaporan' }, { label: 'Kinerja Kasir' }]}
      />
      <CashierPerformanceTab />
    </div>
  )
}
