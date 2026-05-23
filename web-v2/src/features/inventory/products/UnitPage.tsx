import { PageHeader } from '@/shared/components'

import { UnitTab } from './components/UnitTab'

export function UnitPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Satuan Produk"
        breadcrumbs={[{ label: 'Inventori' }, { label: 'Satuan' }]}
      />
      <UnitTab />
    </div>
  )
}
