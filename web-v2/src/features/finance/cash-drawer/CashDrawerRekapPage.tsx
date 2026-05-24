import { PageHeader } from '@/shared/components'

import { CashDrawerSummaryTab } from './components/CashDrawerSummaryTab'

export function CashDrawerRekapPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Rekap Kas"
        breadcrumbs={[{ label: 'Keuangan' }, { label: 'Rekap Kas' }]}
      />
      <CashDrawerSummaryTab />
    </div>
  )
}
