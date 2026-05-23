import { PageHeader } from '@/shared/components'

import { CashDrawerSummaryTab } from './components/CashDrawerSummaryTab'

export function CashDrawerRekapPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Rekap Kas"
        breadcrumbs={[{ label: 'Keuangan' }, { label: 'Rekap Kas' }]}
      />
      <CashDrawerSummaryTab />
    </div>
  )
}
